import React, { useState } from 'react';
import { User, LogOut, ChevronDown, Settings, HelpCircle } from 'lucide-react';
import { USER_ROLES } from '../App';

interface UserProfileProps {
  user: {
    name: string;
    role: string;
  };
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const roleConfig = USER_ROLES[user.role as keyof typeof USER_ROLES];
  const RoleIcon = roleConfig?.icon || User;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
      >
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <RoleIcon className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-medium text-stone-900">{user.name}</div>
          <div className="text-xs text-stone-500">{roleConfig?.name || user.role}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-stone-400" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-20">
            <div className="px-4 py-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <RoleIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-stone-900">{user.name}</div>
                  <div className="text-sm text-stone-500">{roleConfig?.name || user.role}</div>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-stone-50 transition-colors">
                <Settings className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-700">Configuración</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-stone-50 transition-colors">
                <HelpCircle className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-700">Ayuda</span>
              </button>
            </div>
            
            <div className="border-t border-stone-100 pt-2">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};