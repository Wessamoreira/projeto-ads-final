import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// PrimeReact (biblioteca de componentes de UI)
import { PrimeReactProvider, addLocale, locale } from 'primereact/api'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// Design System (mesmos estilos do projeto original)
import './assets/styles/variables.css'
import './assets/styles/glass-theme.css'
import './assets/styles/animations.css'
import './assets/styles/primereact-override.css'

import App from './App'

// Tema claro fixo
document.documentElement.setAttribute('data-theme', 'light')

// Traducao basica do PrimeReact para portugues
addLocale('pt-BR', {
  accept: 'Sim',
  reject: 'Nao',
  choose: 'Escolher',
  cancel: 'Cancelar',
  dayNames: ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
  dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  monthNames: ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  today: 'Hoje',
  clear: 'Limpar',
  firstDayOfWeek: 0,
  dateFormat: 'dd/mm/yy',
  emptyMessage: 'Nenhum resultado encontrado',
})
locale('pt-BR')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PrimeReactProvider value={{ ripple: true, inputStyle: 'filled', locale: 'pt-BR' }}>
        <App />
      </PrimeReactProvider>
    </BrowserRouter>
  </StrictMode>,
)
