"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheck, FiArrowRight, FiArrowLeft, FiInfo, FiUpload, FiFile, FiTrash2 } from 'react-icons/fi';
import { getStoreInfo, getStoreUrl, getStoreAddress } from '@/lib/userStore';

// Types pour les données du formulaire
interface VendorFormData {
  basicInfo: {
    businessName: string;
    businessType: string;
    registrationNumber: string;
    vatNumber: string;
    category: string;
    firstName: string;
    lastName: string;
    position: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  bankInfo: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
    verificationStatus: string | null;
  };
  documents: {
    id: string;
    type: string;
    name: string;
    uploadDate: string;
    size: number;
    file?: File;
  }[];
  contractAgreed: boolean;
}

// Options pour les types d'entreprise
const businessTypeOptions = [
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SA', label: 'SA' },
  { value: 'EURL', label: 'EURL' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SNC', label: 'SNC' },
  { value: 'AUTRE', label: 'Autre' }
];

// Options pour les catégories d'activité
const categoryOptions = [
  { value: 'MODE', label: 'Mode et Vêtements' },
  { value: 'BEAUTE', label: 'Beauté et Cosmétiques' },
  { value: 'MAISON', label: 'Maison et Décoration' },
  { value: 'ELECTRONIQUE', label: 'Électronique et High-Tech' },
  { value: 'ALIMENTATION', label: 'Alimentation et Boissons' },
  { value: 'SPORT', label: 'Sport et Loisirs' },
  { value: 'SANTE', label: 'Santé et Bien-être' },
  { value: 'ENFANTS', label: 'Enfants et Bébés' },
  { value: 'BIJOUX', label: 'Bijoux et Accessoires' },
  { value: 'AUTRE', label: 'Autre' }
];

// Types de documents requis
const documentTypes = [
  { value: 'id_proof', label: 'Pièce d\'identité' },
  { value: 'business_registration', label: 'Extrait K-bis / Registre du commerce' },
  { value: 'vat_certificate', label: 'Attestation de TVA' },
  { value: 'bank_statement', label: 'Relevé d\'identité bancaire' },
  { value: 'insurance_certificate', label: 'Attestation d\'assurance' },
  { value: 'product_certification', label: 'Certification des produits' }
];

// Liste des pays
const countryOptions = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
  { value: 'DE', label: 'Allemagne' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'GB', label: 'Royaume-Uni' }
];

export default function ConfigurationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // État pour les données du formulaire
  const [formData, setFormData] = useState<VendorFormData>({
    basicInfo: {
      businessName: '',
      businessType: '',
      registrationNumber: '',
      vatNumber: '',
      category: '',
      firstName: '',
      lastName: '',
      position: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'FR'
    },
    bankInfo: {
      accountHolder: '',
      iban: '',
      bic: '',
      bankName: '',
      verificationStatus: null
    },
    documents: [],
    contractAgreed: false
  });

  // Charger les données existantes au chargement de la page
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données du stockage local
        const storeUrl = getStoreUrl();
        const storeInfo = getStoreInfo();
        const storeAddress = getStoreAddress();
        
        // Récupérer les données de l'entreprise depuis l'API
        const response = await fetch('/api/vendors/me');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.vendor) {
            // Pré-remplir les données du formulaire avec les informations existantes
            setFormData(prevData => ({
              ...prevData,
              basicInfo: {
                ...prevData.basicInfo,
                businessName: data.vendor.companyName || '',
                registrationNumber: data.vendor.siret || '',
                vatNumber: data.vendor.vatNumber || '',
                email: data.vendor.email || '',
                phone: data.vendor.phoneNumber || '',
                street: data.vendor.address || storeAddress || '',
                city: data.vendor.city || '',
                postalCode: data.vendor.postalCode || '',
                country: data.vendor.country || 'FR'
              }
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingData();
  }, []);

  // Gérer les changements dans les informations de base
  const handleBasicInfoChange = (field: keyof VendorFormData['basicInfo'], value: string) => {
    setFormData(prevData => ({
      ...prevData,
      basicInfo: {
        ...prevData.basicInfo,
        [field]: value
      }
    }));
  };

  // Gérer les changements dans les informations bancaires
  const handleBankInfoChange = (field: keyof VendorFormData['bankInfo'], value: string) => {
    setFormData(prevData => ({
      ...prevData,
      bankInfo: {
        ...prevData.bankInfo,
        [field]: value
      }
    }));
  };
  
  // Gérer les changements dans le formulaire (fonction générique)
  const handleInputChange = (field: string, value: string) => {
    // Déterminer à quelle section appartient le champ
    if (field in formData.basicInfo) {
      handleBasicInfoChange(field as keyof VendorFormData['basicInfo'], value);
    } else if (field in formData.bankInfo) {
      handleBankInfoChange(field as keyof VendorFormData['bankInfo'], value);
    } else {
      // Pour les autres propriétés simples (comme contractAgreed)
      setFormData(prevData => ({
        ...prevData,
        [field]: value === 'true'
      }));
    }
  };

  // Gérer l'upload de documents
  const handleFileUpload = (type: string, file: File) => {
    const newDocument = {
      id: Date.now().toString(),
      type,
      name: file.name,
      uploadDate: new Date().toISOString(),
      size: file.size,
      file
    };

    setFormData(prevData => ({
      ...prevData,
      documents: [...prevData.documents, newDocument]
    }));
  };

  // Supprimer un document
  const handleDeleteDocument = (id: string) => {
    setFormData(prevData => ({
      ...prevData,
      documents: prevData.documents.filter(doc => doc.id !== id)
    }));
  };

  // Valider le formulaire pour chaque étape
  const validateStep = (step: number): boolean => {
    setFormError(null);
    
    switch (step) {
      case 1: // Informations de base
        const { businessName, registrationNumber, vatNumber, firstName, lastName, email, phone } = formData.basicInfo;
        if (!businessName || !registrationNumber || !vatNumber || !firstName || !lastName || !email || !phone) {
          setFormError('Veuillez remplir tous les champs obligatoires');
          return false;
        }
        return true;
        
      case 2: // Adresse
        const { street, city, postalCode, country } = formData.basicInfo;
        if (!street || !city || !postalCode || !country) {
          setFormError('Veuillez remplir tous les champs d\'adresse');
          return false;
        }
        return true;
        
      case 3: // Informations bancaires
        const { accountHolder, iban, bic, bankName } = formData.bankInfo;
        if (!accountHolder || !iban || !bic || !bankName) {
          setFormError('Veuillez remplir toutes les informations bancaires');
          return false;
        }
        return true;
        
      case 4: // Documents
        // Vérifier qu'au moins les documents obligatoires sont téléchargés
        const requiredDocTypes = ['business_registration', 'bank_statement'];
        const uploadedDocTypes = formData.documents.map(doc => doc.type);
        
        const missingDocs = requiredDocTypes.filter(type => !uploadedDocTypes.includes(type));
        
        if (missingDocs.length > 0) {
          const missingDocLabels = missingDocs.map(type => {
            const doc = documentTypes.find(d => d.value === type);
            return doc ? doc.label : type;
          }).join(', ');
          
          setFormError(`Documents manquants: ${missingDocLabels}`);
          return false;
        }
        return true;
        
      case 5: // Contrat
        if (!formData.contractAgreed) {
          setFormError('Vous devez accepter les conditions du contrat pour continuer');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  // Passer à l'étape suivante
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Revenir à l'étape précédente
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Préparer les données pour l'API
      const apiData = {
        basicInfo: formData.basicInfo,
        bankInfo: formData.bankInfo,
        contractAgreed: formData.contractAgreed
      };
      
      // Envoyer les données au serveur
      const response = await fetch('/api/vendors/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement des données');
      }
      
      const result = await response.json();
      
      // Télécharger les documents si nécessaire
      if (formData.documents.length > 0) {
        for (const doc of formData.documents) {
          if (doc.file) {
            const formData = new FormData();
            formData.append('file', doc.file);
            formData.append('type', doc.type);
            
            await fetch(`/api/vendors/documents`, {
              method: 'POST',
              body: formData
            });
          }
        }
      }
      
      setFormSubmitted(true);
      
      // Rediriger vers le tableau de bord après un court délai
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setFormError('Une erreur est survenue lors de l\'enregistrement de vos informations. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Formatter un IBAN pour l'affichage
  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  // Formater la taille d'un fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };
}
