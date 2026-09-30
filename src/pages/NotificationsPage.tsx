import React, { useEffect } from 'react';
import { Bell, Info, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useCommunication } from '../context/CommunicationContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationsAsRead } = useCommunication();

  useEffect(() => {
    // Mark as read when the component mounts
    markNotificationsAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="w-5 h-5 text-blue-500" />;
      case 'offer': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default: return <Bell className="w-5 h-5 text-neutral-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-neutral-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" /> Notifications
          </h2>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {notifications.length === 0 ? (
             <div className="p-12 text-center text-neutral-400">
               <Bell className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-600" />
               <p className="text-sm font-semibold text-neutral-600">No notifications yet.</p>
               <p className="text-xs text-neutral-400 mt-1">We'll let you know when something important happens.</p>
             </div>
          ) : (
            notifications
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(notif => (
              <div key={notif.id} className={`p-4 sm:p-6 flex gap-4 transition-colors ${!notif.isRead ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-neutral-50'}`}>
                <div className="shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-white border border-neutral-100 shadow-sm flex items-center justify-center">
                    {getIcon(notif.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm ${!notif.isRead ? 'font-extrabold text-neutral-900' : 'font-bold text-neutral-800'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {formatTime(notif.createdAt)}
                  </span>
                </div>
                
                {!notif.isRead && (
                  <div className="shrink-0 flex items-start pt-1">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
