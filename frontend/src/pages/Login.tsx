import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { useAuthStore } from '../store/autenticacao'
import { toast } from '../components/common'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  lembrar: z.boolean().optional()
})

type LoginForm = z.infer<typeof loginSchema>

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
      lembrar: false
    }
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()
      await login({ email: data.email, senha: data.senha })
      toast.success('Bem-vindo!', 'Login realizado com sucesso')
      navigate(from, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verifique suas credenciais'
      toast.error('Erro ao entrar', message)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <span className="auth-brand__mark">F</span>
          <span>Finanças</span>
        </div>

        <header className="auth-header">
          <h1 id="login-title">Entrar</h1>
          <p>Acesse sua conta para continuar.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputText
                  id="email"
                  {...field}
                  placeholder="seu@email.com"
                  className={errors.email ? 'p-invalid' : ''}
                  autoComplete="email"
                />
              )}
            />
            {errors.email && <small>{errors.email.message}</small>}
          </div>

          <div className="form-field">
            <label htmlFor="senha">Senha</label>
            <div className="password-field">
              <Controller
                name="senha"
                control={control}
                render={({ field }) => (
                  <InputText
                    id="senha"
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    className={errors.senha ? 'p-invalid' : ''}
                    autoComplete="current-password"
                  />
                )}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`} aria-hidden="true" />
              </button>
            </div>
            {errors.senha && <small>{errors.senha.message}</small>}
          </div>

          <div className="auth-row">
            <Controller
              name="lembrar"
              control={control}
              render={({ field }) => (
                <label className="check-row" htmlFor="lembrar">
                  <Checkbox
                    inputId="lembrar"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.checked)}
                  />
                  <span>Lembrar de mim</span>
                </label>
              )}
            />
            <Link to="/esqueci-senha">Esqueci a senha</Link>
          </div>

          <Button type="submit" className="auth-submit" loading={isLoading}>
            Entrar
          </Button>
        </form>

        <p className="auth-footer">
          Não tem uma conta? <Link to="/registro">Criar conta</Link>
        </p>
      </section>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(248, 250, 252, 0.96) 0%, rgba(248, 250, 252, 0.91) 48%, rgba(248, 250, 252, 0.76) 100%),
            url('/banner-login.jpg') center / cover no-repeat;
          padding: clamp(1.25rem, 4vw, 2.5rem);
        }

        .auth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 58%);
          pointer-events: none;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid var(--border-default);
          border-radius: var(--border-radius-lg);
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.10);
          padding: 2rem;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .auth-brand {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          color: var(--text-primary);
          font-weight: 650;
          margin-bottom: 1.75rem;
        }

        .auth-brand__mark {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-md);
          background: var(--brand);
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .auth-header {
          margin-bottom: 1.5rem;
        }

        .auth-header h1 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 650;
        }

        .auth-header p {
          margin: 0.375rem 0 0;
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .form-field label {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        .form-field small {
          color: var(--color-danger);
          font-size: var(--font-size-xs);
        }

        .password-field {
          position: relative;
        }

        .password-field .p-inputtext {
          width: 100%;
          padding-right: 2.75rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: var(--border-radius-sm);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
        }

        .password-toggle:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .auth-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 0.25rem;
          font-size: var(--font-size-sm);
        }

        .check-row {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .auth-row a,
        .auth-footer a {
          color: var(--text-primary);
          font-weight: 600;
          text-decoration: none;
        }

        .auth-row a:hover,
        .auth-footer a:hover {
          text-decoration: underline;
        }

        .auth-submit {
          width: 100%;
          justify-content: center;
          margin-top: 0.25rem;
        }

        .auth-footer {
          margin: 1.5rem 0 0;
          text-align: center;
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
        }

        @media (max-width: 480px) {
          .auth-page {
            background:
              linear-gradient(180deg, rgba(248, 250, 252, 0.97) 0%, rgba(248, 250, 252, 0.93) 100%),
              url('/banner-login.jpg') center / cover no-repeat;
          }

          .auth-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </main>
  )
}

export default Login
