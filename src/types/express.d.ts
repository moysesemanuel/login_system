declare global {
  namespace Express {
    interface Request {
      auth?: {
        sessionId: string;
        userId: string;
        email: string;
        role: string;
        application: "erp" | "help-desk";
        redirectUrl: string;
      };
    }
  }
}

export {};
