import React, { createContext, useContext, useState, useEffect } from 'react';

export type AgeGroup = 'kid' | 'teen' | 'adult';

interface OnboardingData {
  goal: string | null;
  level: string | null;
  ageGroup: AgeGroup | null;
  dailyMinutes: number | null;
  completed: boolean;
}

interface ThemeContextType {
  ageGroup: AgeGroup;
  setAgeGroup: (age: AgeGroup) => void;
  onboardingData: OnboardingData;
  setOnboardingData: (data: OnboardingData) => void;
  hasCompletedOnboarding: boolean;
  resetOnboarding: () => void;
}

const defaultOnboarding: OnboardingData = {
  goal: null, level: null, ageGroup: null, dailyMinutes: null, completed: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [ageGroup, setAgeGroupState] = useState<AgeGroup>(() => {
    const saved = localStorage.getItem('vokabi-age-group');
    return (saved as AgeGroup) || 'adult';
  });

  const [onboardingData, setOnboardingDataState] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('vokabi-onboarding');
    return saved ? JSON.parse(saved) : defaultOnboarding;
  });

  const setAgeGroup = (age: AgeGroup) => {
    setAgeGroupState(age);
    localStorage.setItem('vokabi-age-group', age);
    document.documentElement.setAttribute('data-age-theme', age);
  };

  const setOnboardingData = (data: OnboardingData) => {
    setOnboardingDataState(data);
    localStorage.setItem('vokabi-onboarding', JSON.stringify(data));
    if (data.ageGroup) setAgeGroup(data.ageGroup);
  };

  const resetOnboarding = () => {
    setOnboardingDataState(defaultOnboarding);
    localStorage.removeItem('vokabi-onboarding');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-age-theme', ageGroup);
  }, [ageGroup]);

  return (
    <ThemeContext.Provider value={{
      ageGroup, setAgeGroup,
      onboardingData, setOnboardingData,
      hasCompletedOnboarding: onboardingData.completed,
      resetOnboarding,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
