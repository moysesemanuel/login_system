declare global {
  namespace Express {
    interface Request {
      auth?: {
        sessionId: string;
        userId: string;
        email: string;
        role: "admin" | "user";
        application: "erp" | "help-desk";
        redirectUrl: string;
      };
    }
  }
}

export {};
