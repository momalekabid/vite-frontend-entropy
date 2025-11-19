import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

interface AuthContextType {
  idToken: string | null
  isAuthenticated: boolean
  handleLoginSuccess: (response: CredentialResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
  clientId: string
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(() => {
    return localStorage.getItem('google_id_token')
  })

  const isAuthenticated = !!idToken

  const handleLoginSuccess = (response: CredentialResponse) => {
    // the credential field contains the JWT ID token we need
    if (response.credential) {
      setIdToken(response.credential)
      localStorage.setItem('google_id_token', response.credential)
      console.log('signed in successfully')
    }
  }

  const signOut = () => {
    setIdToken(null)
    localStorage.removeItem('google_id_token')
    googleLogout()
  }

  useEffect(() => {
    // check if token exists on mount
    const token = localStorage.getItem('google_id_token')
    if (token) {
      setIdToken(token)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ idToken, isAuthenticated, handleLoginSuccess, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children, clientId }: AuthProviderProps) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </GoogleOAuthProvider>
  )
}
