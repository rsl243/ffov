import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { GlobalNotificationProvider } from '@/components/GlobalNotificationProvider'
import { UserProfileProvider } from '@/contexts/UserProfileContext'
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext'
import { SessionProvider } from '@/components/providers/SessionProvider'

// Define CSS variables for fonts using system fonts
const fontStyles = {
  variable: 'font-sans-serif',
  className: 'font-sans-serif',
}

export const metadata: Metadata = {
  title: 'Faet - Gagnez en Phygital',
  description: 'Plateforme intégrée pour la gestion de boutiques en ligne et physiques',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        {/* Définir les variables CSS pour les polices système */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            --font-montserrat: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
        `}} />
      </head>
      <body className="font-sans">
        <SessionProvider>
          <SupabaseProvider>
            <UserProfileProvider>
              <UserPreferencesProvider>
                <NotificationsProvider>
                  <GlobalNotificationProvider>
                    {children}
                    <Toaster />
                  </GlobalNotificationProvider>
                </NotificationsProvider>
              </UserPreferencesProvider>
            </UserProfileProvider>
          </SupabaseProvider>
        </SessionProvider>
      </body>
    </html>
  )
}