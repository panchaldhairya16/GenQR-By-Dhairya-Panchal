export type QRType = 'url' | 'text' | 'phone' | 'email' | 'wifi' | 'sms' | 'social';

export interface WIFIConfig {
  ssid: string;
  password?: string;
  encryption: 'WEP' | 'WPA' | 'nopass';
  hidden: boolean;
}

export interface EmailConfig {
  address: string;
  subject?: string;
  body?: string;
}

export interface SMSConfig {
  phone: string;
  message?: string;
}

export interface SocialConfig {
  platform: 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'custom';
  username: string;
}

export interface QRState {
  type: QRType;
  value: string; // The encoded raw string
  // Form values
  urlValue: string;
  textValue: string;
  phoneValue: string;
  emailConfig: EmailConfig;
  wifiConfig: WIFIConfig;
  smsConfig: SMSConfig;
  socialConfig: SocialConfig;
}

export interface QRDesign {
  fgColor: string;
  bgColor: string;
  size: number;
  margin: number;
  logoUrl: string | null; // For uploaded files or selected presets
  logoScale: number; // 0.1 to 0.3
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface HistoryItem {
  id: string;
  title: string;
  type: QRType;
  rawValue: string;
  design: QRDesign;
  timestamp: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}
