
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemSetting {
  key: string;
  value: any;
}

export const useSystemSettings = () => {
  // Instrument for debugging
  try {
    // intentionally try to get QueryClient instance to see if it errors here
    const queryClient = useQueryClient();
    console.log("[useSystemSettings] QueryClient: OK", queryClient);
  } catch (err) {
    console.error("[useSystemSettings] QueryClient MISSING!!!", err);
    throw err; // surface the error!
  }

  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) throw error;

      // Convert array of settings to key-value object
      const settingsMap: { [key: string]: any } = {};
      data.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      return settingsMap;
    },
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from("settings")
        .upsert({ key, value }, { onConflict: "key" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });
};
