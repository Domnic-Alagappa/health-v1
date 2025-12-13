import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Stack, Label } from '@health-v1/ui-components';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LoginPage() {
  const { t } = useTranslation();
  const [loginMethod, setLoginMethod] = useState<'token' | 'userpass' | 'approle'>('token');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [secretId, setSecretId] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithUserpass, loginWithAppRole, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      // Use replace to avoid adding to history
      navigate({ to: redirectTo as '/', replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (loginMethod === 'token') {
        if (!token.trim()) {
          setError(t('login.errors.tokenRequired'));
          return;
        }
        await login(token.trim());
      } else if (loginMethod === 'userpass') {
        if (!username.trim() || !password.trim()) {
          setError(t('login.errors.usernamePasswordRequired'));
          return;
        }
        await loginWithUserpass(username.trim(), password);
      } else if (loginMethod === 'approle') {
        if (!roleId.trim() || !secretId.trim()) {
          setError(t('login.errors.roleIdSecretIdRequired'));
          return;
        }
        await loginWithAppRole(roleId.trim(), secretId.trim());
      }
      
      // Navigation: Zustand updates are synchronous, but React needs a tick to re-render
      // Check both the hook value and getState() to be safe
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      
      // Try immediate navigation (Zustand state is updated synchronously)
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        navigate({ to: redirectTo as '/', replace: true });
        return; // Exit early if navigation succeeds
      }
      
      // Fallback: Use requestAnimationFrame to ensure React has processed the state update
      requestAnimationFrame(() => {
        const currentState = useAuthStore.getState();
        if (currentState.isAuthenticated) {
          navigate({ to: redirectTo as '/', replace: true });
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('login.errors.authenticationFailed');
      
      // Check if the error is about the vault being sealed
      if (errorMessage.toLowerCase().includes('barrier is sealed') || 
          errorMessage.toLowerCase().includes('vault is sealed') ||
          errorMessage.toLowerCase().includes('vault error: barrier is sealed')) {
        setError(t('login.errors.vaultSealed'));
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t('login.title')}</CardTitle>
          <CardDescription className="text-center">{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Stack spacing="md">
              <div className="flex gap-2 border-b">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    loginMethod === 'token'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLoginMethod('token')}
                >
                  {t('login.methods.token')}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    loginMethod === 'userpass'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLoginMethod('userpass')}
                >
                  {t('login.methods.userpass')}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    loginMethod === 'approle'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLoginMethod('approle')}
                >
                  {t('login.methods.approle')}
                </button>
              </div>

              {loginMethod === 'token' && (
                <div className="space-y-2">
                  <Label htmlFor="token">{t('login.fields.token')}</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder={t('login.placeholders.token')}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>
              )}

              {loginMethod === 'userpass' && (
                <Stack spacing="md">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('login.fields.username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('login.placeholders.username')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('login.fields.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('login.placeholders.password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </Stack>
              )}

              {loginMethod === 'approle' && (
                <Stack spacing="md">
                  <div className="space-y-2">
                    <Label htmlFor="roleId">{t('login.fields.roleId')}</Label>
                    <Input
                      id="roleId"
                      type="text"
                      placeholder={t('login.placeholders.roleId')}
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      disabled={isLoading}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretId">{t('login.fields.secretId')}</Label>
                    <Input
                      id="secretId"
                      type="password"
                      placeholder={t('login.placeholders.secretId')}
                      value={secretId}
                      onChange={(e) => setSecretId(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </Stack>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('login.actions.signingIn')}
                  </>
                ) : (
                  t('login.actions.signIn')
                )}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

