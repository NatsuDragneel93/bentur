import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import { FirebaseProvider } from './context/firebase.context.ts'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <FirebaseProvider>
  //     <App />
  //   </FirebaseProvider>
  // </StrictMode>,
  <StrictMode>
    <App />
  </StrictMode>,
)

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then((registration) => {
//       console.log('Service Worker registrato con successo:', registration)
//     }).catch((error) => {
//       console.error('Errore nella registrazione del Service Worker:', error)
//     })
//   })
// }