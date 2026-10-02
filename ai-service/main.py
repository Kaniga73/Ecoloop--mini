import io
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
import torch
from transformers import CLIPModel, CLIPProcessor

# 1. Exact 21 waste labels required by the specification
WASTE_LABELS = [
    "plastic waste",
    "paper waste",
    "cardboard waste",
    "glass waste",
    "metal waste",
    "organic waste",
    "e-waste",
    "textile waste",
    "rubber waste",
    "wood waste",
    "battery waste",
    "medical waste",
    "chemical waste",
    "construction waste",
    "ceramic waste",
    "leather waste",
    "garden waste",
    "food packaging waste",
    "mixed waste",
    "general residual waste",
    "other waste"
]

# 2. Human labels used strictly for human rejection detection
HUMAN_LABELS = [
    "a photo of a person",
    "a selfie of a human face",
    "a portrait photo of a man or woman"
]

# 3. Static dictionary mapping every waste label to recyclability, hazard status, and safety tips
WASTE_METADATA: Dict[str, Dict[str, Any]] = {
    "plastic waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Rinse and clean before placing in the plastic recycling bin."
    },
    "paper waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Keep dry and clean; dispose in the paper recycling bin."
    },
    "cardboard waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Flatten boxes and keep dry before placing in the cardboard recycling container."
    },
    "glass waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Rinse and separate by color before placing in the glass recycling bin."
    },
    "metal waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Clean off residues and place in the scrap metal or can recycling bin."
    },
    "organic waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Ideal for composting or municipal organic bio-waste processing."
    },
    "e-waste": {
        "recyclable": True,
        "hazard_status": "Possibly hazardous",
        "tip": "Handle carefully and dispose through an authorized e-waste collection facility."
    },
    "textile waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Donate if wearable, or take to a textile recycling drop-off point."
    },
    "rubber waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Take to a specialized rubber recycling facility or tire collection depot."
    },
    "wood waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Repurpose for carpentry, chip for mulch, or take to timber recycling."
    },
    "battery waste": {
        "recyclable": True,
        "hazard_status": "Possibly hazardous",
        "tip": "Handle carefully and dispose through an authorized battery collection facility."
    },
    "medical waste": {
        "recyclable": False,
        "hazard_status": "Possibly hazardous",
        "tip": "Handle carefully and dispose through an authorized biomedical waste collection facility."
    },
    "chemical waste": {
        "recyclable": False,
        "hazard_status": "Possibly hazardous",
        "tip": "Handle carefully and dispose through an authorized hazardous chemical collection facility."
    },
    "construction waste": {
        "recyclable": True,
        "hazard_status": "Possibly hazardous",
        "tip": "Handle carefully and dispose through an appropriate construction waste collection facility."
    },
    "ceramic waste": {
        "recyclable": False,
        "hazard_status": "Not likely hazardous",
        "tip": "Wrap securely and dispose with inert construction debris or general residual waste."
    },
    "leather waste": {
        "recyclable": False,
        "hazard_status": "Not likely hazardous",
        "tip": "Repurpose where possible or dispose in municipal non-recyclable residual waste."
    },
    "garden waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Compost on site or place in your municipal green waste collection bin."
    },
    "food packaging waste": {
        "recyclable": True,
        "hazard_status": "Not likely hazardous",
        "tip": "Empty all food residue and place clean packaging in the dry recyclables bin."
    },
    "mixed waste": {
        "recyclable": False,
        "hazard_status": "Cannot determine",
        "tip": "Separate mixed materials into individual recyclables where possible before disposal."
    },
    "general residual waste": {
        "recyclable": False,
        "hazard_status": "Cannot determine",
        "tip": "Dispose in the standard municipal non-recyclable residual waste stream."
    },
    "other waste": {
        "recyclable": False,
        "hazard_status": "Cannot determine",
        "tip": "Check local municipal waste management guidelines for proper disposal and sorting."
    }
}

# Build text prompts
WASTE_PROMPTS = [f"a photo of {label}" for label in WASTE_LABELS]
ALL_PROMPTS = WASTE_PROMPTS + HUMAN_LABELS

# Global model and processor references
device = "cuda" if torch.cuda.is_available() else "cpu"
model: CLIPModel = None
processor: CLIPProcessor = None


def format_waste_type(label: str) -> str:
    """Format label to Title Case matching example 'Battery waste' or 'E-waste'."""
    if label.lower().startswith("e-waste"):
        return "E-waste"
    return label.capitalize()


def load_clip():
    global model, processor
    if model is None or processor is None:
        print(f"Loading CLIP model and processor ('openai/clip-vit-base-patch32') on {device}...")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model.eval()
        print("CLIP model loaded successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_clip()
    yield


app = FastAPI(
    title="Open-Source Waste Image Classification Service",
    description="Zero-shot waste classification using OpenAI CLIP ViT-B/32",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local cross-origin development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": "openai/clip-vit-base-patch32",
        "device": device
    }


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    # 1. Validate and load image
    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty image file received.")
        
        # Verify image using Pillow
        raw_image = Image.open(io.BytesIO(contents))
        raw_image.verify()

        # Reopen image for processing (verify closes stream)
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid or corrupt image file. Please provide a valid JPG, PNG, or WEBP image."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read image file: {str(e)}"
        )

    # 2. Ensure model is initialized
    load_clip()

    # 3. Process image with CLIP text prompts
    try:
        inputs = processor(
            text=ALL_PROMPTS,
            images=image,
            return_tensors="pt",
            padding=True
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image  # [1, len(ALL_PROMPTS)]
            probs_all = logits_per_image.softmax(dim=1).squeeze(0)  # [len(ALL_PROMPTS)]

        # Check if the overall top prediction is a human prompt
        top_idx = int(torch.argmax(probs_all).item())
        num_waste_labels = len(WASTE_LABELS)

        if top_idx >= num_waste_labels:
            return {
                "is_waste": False,
                "alert": "Human image detected. This system supports only waste images."
            }

        # Calculate normalized probabilities across the 21 waste categories
        waste_logits = logits_per_image[0, :num_waste_labels]
        waste_probs = waste_logits.softmax(dim=0)

        # Top waste prediction
        top_prob_tensor, top_waste_idx_tensor = torch.max(waste_probs, dim=0)
        best_waste_idx = int(top_waste_idx_tensor.item())
        best_label = WASTE_LABELS[best_waste_idx]
        confidence = round(float(top_prob_tensor.item()), 3)

        # Top 3 waste categories
        top3_values, top3_indices = torch.topk(waste_probs, k=min(3, num_waste_labels))
        top_3 = [
            {
                "category": WASTE_LABELS[int(idx.item())],
                "confidence": round(float(val.item()), 3)
            }
            for val, idx in zip(top3_values, top3_indices)
        ]

        # Metadata lookup
        meta = WASTE_METADATA.get(best_label, {
            "recyclable": False,
            "hazard_status": "Cannot determine",
            "tip": "Consult local municipal waste guidelines for proper handling."
        })

        result: Dict[str, Any] = {
            "is_waste": True,
            "waste_type": format_waste_type(best_label),
            "category": best_label,
            "confidence": confidence,
            "recyclable": meta["recyclable"],
            "hazard_status": meta["hazard_status"],
            "tip": meta["tip"],
            "top_3": top_3
        }

        if confidence < 0.35:
            result["low_confidence"] = True

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CLIP model inference failed: {str(e)}"
        )
