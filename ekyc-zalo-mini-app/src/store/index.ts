import { create } from "zustand";
import { config as configReadCard, readConfig } from "@ekyc-zma-sdk/read-card";
import { config as configLiveness } from "@ekyc-zma-sdk/liveness";
import { appId, faceUrl, ekycUrl, privateKey, publicKey } from "@/constants";
import { closeLoading } from "zmp-sdk";

export const useAppStore = create<{
  agentName?: string;
  appLogo?: string;
  fetchAppConfig: (agentCode: string) => Promise<void>;
}>()((set) => ({
  fetchAppConfig: async (agentCode) => {
    configReadCard({
      appId,
      baseUrl: ekycUrl,
      publicKey,
      privateKey,
      agentCode: agentCode,
    });
    configLiveness({
      appId,
      baseUrl: faceUrl,
      publicKey,
      privateKey,
      agentCode: agentCode,
    });
    // setLoading(true);
    const res = await readConfig();
    set({
      appLogo: res.data.data.logo,
      agentName: res.data.data.name,
    });
    const styles = JSON.parse(res.data.data.customStyles ?? "");
    const primaryColor = styles.primaryColor;
    const primaryForegroundColor = styles.primaryForegroundColor;
    document.documentElement.style.setProperty(
      "--nhatnuoc-primary-color",
      primaryColor
    );
    document.documentElement.style.setProperty(
      "--nhatnuoc-primary-foreground-color",
      primaryForegroundColor
    );
    closeLoading()
    // .finally(() => setLoading(false));
  },
}));
