import React, { useState } from 'react';
import { UserProfile, Language, VehicleType } from '../types';
import { ChevronLeft, Save, User, Mail, MapPin, Smartphone, Gauge, LayoutGrid, Clock, Moon, Globe, Edit2, LocateFixed, Loader2 } from 'lucide-react';

interface Props {
    mode: 'view' | 'edit';
    user: UserProfile;
    onUpdate: (profile: UserProfile) => void;
    onBack: () => void;
    onEdit: () => void;
}

interface InputFieldProps {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    value?: string | number;
    onChange: (value: string) => void;
    theme: string;
    type?: string;
    action?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChange, theme, type = 'text', action }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <Icon size={20} className="text-gray-400" />
            <input
                type={type}
                value={value || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                className={`flex-1 bg-transparent font-bold outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                placeholder={`Enter ${label}`}
            />
            {action}
        </div>
    </div>
);

interface DisplayFieldProps {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    value?: string | number;
    theme: string;
}

const DisplayField: React.FC<DisplayFieldProps> = ({ label, icon: Icon, value, theme }) => (
    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Icon size={20} className="text-gigmate-blue" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
            <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value || 'Not set'}</p>
        </div>
    </div>
);

const ProfileManager: React.FC<Props> = ({ mode, user, onUpdate, onBack, onEdit }) => {
    const [formData, setFormData] = useState<UserProfile>(user);
    const [detecting, setDetecting] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Using OpenStreetMap Nominatim
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                        headers: {
                            'User-Agent': 'GigMate/1.0'
                        }
                    });
                    if (!response.ok) throw new Error("Geocoding failed");

                    const data = await response.json();
                    if (data && data.address) {
                        // Extract most relevant city name
                        const city = data.address.city || data.address.town || data.address.state_district || data.address.village || data.address.county;
                        if (city) {
                            setFormData(prev => ({ ...prev, city }));
                        } else {
                            alert("Could not determine city from your location.");
                        }
                    }
                } catch (error) {
                    console.error("Location detection failed", error);
                    alert("Failed to fetch address details. Please enter city manually.");
                } finally {
                    setDetecting(false);
                }
            },
            (error) => {
                setDetecting(false);
                console.error("Geolocation error:", error);
                let msg = "Location error.";
                if (error.code === 1) msg = "Location permission denied. Please enable location access in browser settings.";
                else if (error.code === 2) msg = "Location unavailable. Try again.";
                else if (error.code === 3) msg = "Location request timed out.";
                alert(msg);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleSave = () => {
        onUpdate(formData);
    };

    return (
        <div className={`h-full flex flex-col ${user.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} animate-in slide-in-from-right duration-300`}>
            {/* Header */}
            <div className={`flex-none p-4 flex items-center justify-between border-b ${user.theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-black italic tracking-tight">{mode === 'edit' ? 'Edit Profile' : 'Profile Details'}</h1>
                <div className="w-10">
                    {mode === 'view' && (
                        <button onClick={onEdit} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Edit2 size={20} className="text-gigmate-blue" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6">
                {mode === 'edit' ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 stagger-1">
                        <InputField
                            label="Full Name"
                            icon={User}
                            value={formData.name}
                            onChange={(v: string) => setFormData({ ...formData, name: v })}
                            theme={user.theme}
                        />
                        <InputField
                            label="Phone Number"
                            icon={Smartphone}
                            value={formData.phoneNumber}
                            onChange={(v: string) => setFormData({ ...formData, phoneNumber: v })}
                            theme={user.theme}
                        />
                        <InputField
                            label="Email Address"
                            icon={Mail}
                            value={formData.email}
                            onChange={(v: string) => setFormData({ ...formData, email: v })}
                            theme={user.theme}
                        />
                        <InputField
                            label="City"
                            icon={MapPin}
                            value={formData.city}
                            onChange={(v: string) => setFormData({ ...formData, city: v })}
                            theme={user.theme}
                            action={
                                <button
                                    onClick={detectLocation}
                                    disabled={detecting}
                                    className="p-2 bg-blue-50 text-gigmate-blue rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    title="Auto-detect location"
                                >
                                    {detecting ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
                                </button>
                            }
                        />
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Daily Earn Goal (₹)</label>
                            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                <Gauge size={20} className="text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.dailyGoal}
                                    onChange={e => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) || 0 })}
                                    className={`flex-1 bg-transparent font-bold outline-none ${user.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom duration-500 stagger-1">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-gigmate-green to-gigmate-blue flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                {user.name ? user.name.charAt(0).toUpperCase() : (user.phoneNumber?.slice(-2) || 'GM')}
                            </div>
                        </div>

                        <DisplayField label="Full Name" icon={User} value={user.name} theme={user.theme} />
                        <DisplayField label="Phone" icon={Smartphone} value={user.phoneNumber} theme={user.theme} />
                        <DisplayField label="Email" icon={Mail} value={user.email} theme={user.theme} />
                        <DisplayField label="City" icon={MapPin} value={user.city} theme={user.theme} />
                        <DisplayField label="Vehicle" icon={Gauge} value={user.vehicle} theme={user.theme} />
                        <DisplayField label="Daily Goal" icon={Clock} value={`₹${user.dailyGoal}/day`} theme={user.theme} />
                        <DisplayField label="Language" icon={Globe} value={user.language === 'en' ? 'English' : 'Native'} theme={user.theme} />

                        <div className={`p-4 rounded-2xl border ${user.theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Platforms</p>
                            <div className="flex flex-wrap gap-2">
                                {user.platforms.map(p => (
                                    <span key={p} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {mode === 'edit' && (
                <div className={`flex-none p-6 border-t ${user.theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} bg-inherit sticky bottom-0 z-10 safe-area-pb`}>
                    <button
                        onClick={handleSave}
                        className="w-full bg-gigmate-green text-white py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileManager;
