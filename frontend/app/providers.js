'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

// Cargar Stripe fuera del componente para evitar recreaciones
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function Providers({ children }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}