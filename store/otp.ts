import { UserType } from "@/types/ModelsType";
import { create } from "zustand";

type OTPStore = {
    profile: UserType;
    setProfile: (profile: UserType) => void;
};

export const useOTP = create<OTPStore>((set, get) => ({
    profile: {
        id: "",
        name: '',
    } as any,
    setProfile: (profile) => set({ profile }),
}));