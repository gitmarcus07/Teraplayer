import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function SignInForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Signed in successfully");
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Unable to sign in";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid="auth-signin-form">
      {error && (
        <p className="text-sm text-destructive" data-testid="signin-error">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="signin-email-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="signin-password-input"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
        data-testid="signin-submit-btn"
      >
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

function SignUpForm({ onSuccess }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      await signup({ email, password, name });
      toast.success("Account created successfully");
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Unable to create account";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} data-testid="auth-signup-form">
      {error && (
        <p className="text-sm text-destructive" data-testid="signup-error">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="signup-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="signup-email-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          data-testid="signup-password-input"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
        data-testid="signup-submit-btn"
      >
        {submitting ? "Creating account…" : "Sign Up"}
      </Button>
    </form>
  );
}

export function AuthModal({ open, onOpenChange }) {
  const { isAuthed } = useAuth();

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle>Welcome to TeraPlayer</DialogTitle>
          <DialogDescription>
            {isAuthed
              ? "You are already signed in."
              : "Sign in or create an account to save your favorites and history across devices."}
          </DialogDescription>
        </DialogHeader>

        {isAuthed ? (
          <p>You are already signed in. Close this window to continue.</p>
        ) : (
          <Tabs defaultValue="signin" className="w-full" data-testid="auth-tabs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" data-testid="tab-signin">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <SignInForm onSuccess={handleSuccess} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
