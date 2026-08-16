import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export interface PasswordAnalysis {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  score: number;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong';
  color: string;
}

export function evaluatePassword(pwd: string): PasswordAnalysis {
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);

  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber];
  const metCount = criteria.filter(Boolean).length;

  let score = 0;
  let label: PasswordAnalysis['label'] = 'Very Weak';
  let color = 'bg-rose-500 text-rose-600';

  if (pwd.length === 0) {
    return {
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      score: 0,
      label: 'Very Weak',
      color: 'bg-slate-200 text-slate-400',
    };
  }

  if (metCount === 1) {
    score = 25;
    label = 'Very Weak';
    color = 'bg-rose-500 text-rose-600';
  } else if (metCount === 2) {
    score = 50;
    label = 'Weak';
    color = 'bg-amber-500 text-amber-600';
  } else if (metCount === 3) {
    score = 75;
    label = 'Fair';
    color = 'bg-emerald-500 text-emerald-600';
  } else if (metCount === 4) {
    score = 100;
    label = 'Strong';
    color = 'bg-emerald-600 text-emerald-600';
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    score,
    label,
    color,
  };
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
}) => {
  const analysis = evaluatePassword(password);

  const bars = [1, 2, 3, 4];
  const activeBars = Math.ceil(analysis.score / 25);

  const getBarColor = (index: number) => {
    if (index > activeBars) return 'bg-slate-200';
    if (activeBars <= 1) return 'bg-rose-500';
    if (activeBars === 2) return 'bg-amber-500';
    if (activeBars === 3) return 'bg-teal-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="space-y-2 mt-1.5" id="password-strength-indicator">
      {/* Strength Bar */}
      <div className="flex items-center gap-1.5">
        {bars.map((barIndex) => (
          <div
            key={barIndex}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${getBarColor(
              barIndex
            )}`}
          />
        ))}
      </div>

      {password.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Password strength</span>
          <span className={`font-semibold ${
            activeBars === 4 ? 'text-emerald-700' : activeBars === 3 ? 'text-teal-700' : activeBars === 2 ? 'text-amber-700' : 'text-rose-600'
          }`}>
            {analysis.label}
          </span>
        </div>
      )}

      {/* Criteria list */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
          <CriterionItem met={analysis.hasMinLength} text="At least 8 characters" />
          <CriterionItem met={analysis.hasUppercase} text="One uppercase letter" />
          <CriterionItem met={analysis.hasLowercase} text="One lowercase letter" />
          <CriterionItem met={analysis.hasNumber} text="One number" />
        </div>
      )}
    </div>
  );
};

interface CriterionItemProps {
  met: boolean;
  text: string;
}

const CriterionItem: React.FC<CriterionItemProps> = ({ met, text }) => (
  <div className="flex items-center gap-1.5 text-[11px]">
    {met ? (
      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <Check className="w-2.5 h-2.5 stroke-[3]" />
      </div>
    ) : (
      <div className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
        <X className="w-2.5 h-2.5 stroke-[2.5]" />
      </div>
    )}
    <span className={met ? 'text-slate-700 font-medium' : 'text-slate-600'}>
      {text}
    </span>
  </div>
);
