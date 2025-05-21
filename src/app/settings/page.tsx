"use client";

import React, { useState, useEffect } from 'react';
import { FiUser, FiSettings, FiGlobe, FiMoon, FiSun, FiMonitor, FiDollarSign, FiCalendar, FiClock, FiBell, FiSave, FiInfo, FiAlertCircle } from 'react-icons/fi';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { UserSettings, getUserSettings, updateUserSettings, applyUserTheme } from '@/lib/userSettingsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user } = useAuth();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: ''
  });
  
  // Récupérer les paramètres de l'utilisateur au chargement
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const settings = await getUserSettings();
        setUserSettings(settings);
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres:', error);
        setNotification({
          show: true,
          type: 'error',
          message: 'Impossible de charger vos paramètres'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // Appliquer le thème actuel
  useEffect(() => {
    if (userSettings) {
      applyUserTheme();
    }
  }, [userSettings]);
  
  // Gérer l'enregistrement des paramètres
  const handleSaveSettings = async () => {
    if (!userSettings) return;
    
    setIsSaving(true);
    try {
      const updatedSettings = await updateUserSettings(userSettings);
      
      if (updatedSettings) {
        setUserSettings(updatedSettings);
        
        // Appliquer le nouveau thème
        applyUserTheme();
        
        setNotification({
          show: true,
          type: 'success',
          message: 'Paramètres enregistrés avec succès'
        });
        
        // Masquer la notification après quelques secondes
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Erreur lors de l\'enregistrement des paramètres'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Mettre à jour un paramètre spécifique
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!userSettings) return;
    
    setUserSettings(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };
  
  // Rendering des paramètres généraux
  const renderGeneralSettings = () => {
    if (isLoading || !userSettings) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Paramètres de thème */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiMonitor className="mr-2" />
              Apparence
            </CardTitle>
            <CardDescription>Personnalisez l'apparence de l'interface</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={userSettings.theme} 
              onValueChange={(value: string) => updateSetting('theme', value as 'light' | 'dark' | 'system')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex items-center cursor-pointer">
                  <FiSun className="mr-2" />
                  Clair
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex items-center cursor-pointer">
                  <FiMoon className="mr-2" />
                  Sombre
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex items-center cursor-pointer">
                  <FiMonitor className="mr-2" />
                  Système
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Paramètres de langue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiGlobe className="mr-2" />
              Langue
            </CardTitle>
            <CardDescription>Choisissez la langue de l'interface</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={userSettings.language} 
              onValueChange={(value: string) => updateSetting('language', value as 'fr' | 'en')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fr" id="lang-fr" />
                <Label htmlFor="lang-fr" className="cursor-pointer">Français</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="cursor-pointer">English</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Paramètres de devise et format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiDollarSign className="mr-2" />
              Devise et Format
            </CardTitle>
            <CardDescription>Personnalisez l'affichage des montants et des dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="block mb-2">Devise</Label>
                <RadioGroup 
                  value={userSettings.currency} 
                  onValueChange={(value: string) => updateSetting('currency', value as 'EUR' | 'USD' | 'GBP')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EUR" id="currency-eur" />
                    <Label htmlFor="currency-eur" className="cursor-pointer">Euro (€)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="USD" id="currency-usd" />
                    <Label htmlFor="currency-usd" className="cursor-pointer">Dollar ($)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="GBP" id="currency-gbp" />
                    <Label htmlFor="currency-gbp" className="cursor-pointer">Livre (£)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="block mb-2">Format de date</Label>
                <RadioGroup 
                  value={userSettings.dateFormat} 
                  onValueChange={(value: string) => updateSetting('dateFormat', value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DD/MM/YYYY" id="date-format-1" />
                    <Label htmlFor="date-format-1" className="cursor-pointer">31/12/2025 (Français)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MM/DD/YYYY" id="date-format-2" />
                    <Label htmlFor="date-format-2" className="cursor-pointer">12/31/2025 (Américain)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="YYYY-MM-DD" id="date-format-3" />
                    <Label htmlFor="date-format-3" className="cursor-pointer">2025-12-31 (ISO)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="block mb-2">Format d'heure</Label>
                <RadioGroup 
                  value={userSettings.timeFormat} 
                  onValueChange={(value: string) => updateSetting('timeFormat', value as '24h' | '12h')}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="time-format-24" />
                    <Label htmlFor="time-format-24" className="cursor-pointer">14:30 (24h)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="12h" id="time-format-12" />
                    <Label htmlFor="time-format-12" className="cursor-pointer">2:30 PM (12h)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Rendering des paramètres de disposition
  const renderLayoutSettings = () => {
    if (isLoading || !userSettings) {
      return (
        <div className="space-y-6">
          {[1, 2].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Paramètres de disposition du tableau de bord */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiSettings className="mr-2" />
              Disposition du tableau de bord
            </CardTitle>
            <CardDescription>Personnalisez l'affichage de votre tableau de bord</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={userSettings.dashboardLayout} 
              onValueChange={(value: string) => updateSetting('dashboardLayout', value as 'default' | 'compact' | 'expanded')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="layout-default" />
                <Label htmlFor="layout-default" className="cursor-pointer">Standard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="layout-compact" />
                <Label htmlFor="layout-compact" className="cursor-pointer">Compact (plus d'informations dans un espace réduit)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expanded" id="layout-expanded" />
                <Label htmlFor="layout-expanded" className="cursor-pointer">Étendu (graphiques plus grands)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Paramètres de vue par défaut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiSettings className="mr-2" />
              Vue par défaut
            </CardTitle>
            <CardDescription>Choisissez la page qui s'affiche en premier à la connexion</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={userSettings.defaultView} 
              onValueChange={(value: string) => updateSetting('defaultView', value as 'dashboard' | 'sales' | 'clients' | 'marketing' | 'analytics' | 'finance')}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dashboard" id="view-dashboard" />
                <Label htmlFor="view-dashboard" className="cursor-pointer">Tableau de bord</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sales" id="view-sales" />
                <Label htmlFor="view-sales" className="cursor-pointer">Ventes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clients" id="view-clients" />
                <Label htmlFor="view-clients" className="cursor-pointer">Clients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="marketing" id="view-marketing" />
                <Label htmlFor="view-marketing" className="cursor-pointer">Marketing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="analytics" id="view-analytics" />
                <Label htmlFor="view-analytics" className="cursor-pointer">Analyses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="finance" id="view-finance" />
                <Label htmlFor="view-finance" className="cursor-pointer">Finance</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Rendering des paramètres de notifications
  const renderNotificationSettings = () => {
    if (isLoading || !userSettings) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FiBell className="mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>Gérez vos préférences de notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="block font-medium">Notifications par email</Label>
                  <p className="text-sm text-gray-500">Recevoir des mises à jour par email</p>
                </div>
                <Switch 
                  checked={userSettings.emailNotifications} 
                  onCheckedChange={(checked: boolean) => updateSetting('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="block font-medium">Notifications par SMS</Label>
                  <p className="text-sm text-gray-500">Recevoir des alertes par SMS</p>
                </div>
                <Switch 
                  checked={userSettings.smsNotifications} 
                  onCheckedChange={(checked: boolean) => updateSetting('smsNotifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-lg flex items-center text-yellow-700">
              <FiInfo className="mr-2" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-yellow-50 text-yellow-700">
            <p>Les notifications par SMS peuvent entraîner des frais supplémentaires selon votre forfait. Assurez-vous que votre numéro de téléphone est à jour dans les paramètres de votre compte.</p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <>
      <PageHeader title="Paramètres" />
      
      <div className="p-6">
        {/* Notification */}
        {notification.show && (
          <div className={`mb-6 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <FiInfo className="mr-3" />
              ) : (
                <FiAlertCircle className="mr-3" />
              )}
              <p>{notification.message}</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'general' ? 'Paramètres généraux' : 
             activeTab === 'layout' ? 'Disposition' : 
             'Notifications'}
          </h2>
          
          <Button 
            onClick={handleSaveSettings} 
            disabled={isLoading || isSaving}
            className="flex items-center"
          >
            {isSaving ? "Enregistrement..." : (
              <>
                <FiSave className="mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
        
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="general" className="flex items-center">
              <FiUser className="mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center">
              <FiSettings className="mr-2" />
              Disposition
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <FiBell className="mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            {renderGeneralSettings()}
          </TabsContent>
          
          <TabsContent value="layout">
            {renderLayoutSettings()}
          </TabsContent>
          
          <TabsContent value="notifications">
            {renderNotificationSettings()}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
