import { AppProvider } from './context/AppContext'
import { Routing } from './routing/Routing'

export default function App() {
  return (
    <AppProvider>
      <Routing />
    </AppProvider>
  )
}
