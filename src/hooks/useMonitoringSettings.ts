import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export type MonitoringSettings = Database["public"]["Tables"]["monitoring_settings"]["Row"];

export function useMonitoringSettings() {
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monitoring_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      
      // If no data exists, we provide default
      if (!data) {
        setSettings({ id: 1, ipp_trend_threshold: 5, updated_at: new Date().toISOString() });
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching monitoring settings:', error);
      toast({
        title: "Gagal memuat pengaturan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateThreshold = async (newThreshold: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('monitoring_settings')
        .upsert({ id: 1, ipp_trend_threshold: newThreshold, updated_at: new Date().toISOString() });

      if (error) throw error;
      
      setSettings(prev => prev ? { ...prev, ipp_trend_threshold: newThreshold } : { id: 1, ipp_trend_threshold: newThreshold, updated_at: new Date().toISOString() });
      
      toast({
        title: "Pengaturan Disimpan",
        description: `Ambang batas tren IPP berhasil diubah menjadi ${newThreshold} poin.`,
      });
    } catch (error) {
      console.error('Error saving monitoring settings:', error);
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateThreshold,
    refreshSettings: fetchSettings
  };
}
