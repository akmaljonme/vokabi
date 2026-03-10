import { useState } from 'react';
import { Save, Palette, Bell, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const SettingsTab = () => {
  const [settings, setSettings] = useState({
    siteName: 'Vokabi',
    primaryColor: '#0ea5e9',
    enableNotifications: true,
    maintenanceMode: false,
    scoringThresholds: {
      A1: { min: 0, max: 20 },
      A2: { min: 21, max: 40 },
      B1: { min: 41, max: 60 },
      B2: { min: 61, max: 80 },
      C1: { min: 81, max: 100 },
    }
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage platform configuration</p>
      </div>

      {/* General Settings */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">General Settings</h3>
        </div>
        <Separator />
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input 
              id="siteName"
              value={settings.siteName}
              onChange={(e) => setSettings(s => ({ ...s, siteName: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-3">
              <Input 
                id="primaryColor"
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input 
                value={settings.primaryColor}
                onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CEFR Scoring Thresholds */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">CEFR Scoring Thresholds</h3>
        </div>
        <Separator />
        
        <p className="text-sm text-muted-foreground">
          Configure the score ranges for each CEFR level
        </p>
        
        <div className="space-y-4">
          {Object.entries(settings.scoringThresholds).map(([level, range]) => (
            <div key={level} className="flex items-center gap-4">
              <span className={`w-12 px-2 py-1 rounded text-center text-sm font-medium bg-level-${level.toLowerCase()}/20 text-level-${level.toLowerCase()}`}>
                {level}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <Input 
                  type="number"
                  value={range.min}
                  onChange={(e) => setSettings(s => ({
                    ...s,
                    scoringThresholds: {
                      ...s.scoringThresholds,
                      [level]: { ...range, min: parseInt(e.target.value) || 0 }
                    }
                  }))}
                  className="w-20"
                  min={0}
                  max={100}
                />
                <span className="text-muted-foreground">to</span>
                <Input 
                  type="number"
                  value={range.max}
                  onChange={(e) => setSettings(s => ({
                    ...s,
                    scoringThresholds: {
                      ...s.scoringThresholds,
                      [level]: { ...range, max: parseInt(e.target.value) || 0 }
                    }
                  }))}
                  className="w-20"
                  min={0}
                  max={100}
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Notifications</p>
            <p className="text-sm text-muted-foreground">Send notifications to users about new tests</p>
          </div>
          <Switch 
            checked={settings.enableNotifications}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, enableNotifications: checked }))}
          />
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Security</h3>
        </div>
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Maintenance Mode</p>
            <p className="text-sm text-muted-foreground">Temporarily disable access for non-admins</p>
          </div>
          <Switch 
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => setSettings(s => ({ ...s, maintenanceMode: checked }))}
          />
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} size="lg">
        <Save className="w-4 h-4 mr-2" />
        Save Settings
      </Button>
    </div>
  );
};
