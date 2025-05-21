"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiCheck, FiInfo, FiUpload, FiFile, FiTrash2, FiDownload } from 'react-icons/fi';

// Interface pour les documents
interface Document {
  id: string;
  type: string;
  name: string;
  uploadDate: string;
  size: number;
  status: 'pending' | 'validated' | 'rejected' | null;
  file?: File;
}

// Types de documents requis
const documentTypes = [
  { value: 'id_proof', label: 'Pièce d\'identité', required: true, description: 'Carte d\'identité ou passeport du représentant légal' },
  { value: 'business_registration', label: 'Extrait K-bis / Registre du commerce', required: true, description: 'Document officiel de moins de 3 mois' },
  { value: 'vat_certificate', label: 'Attestation de TVA', required: true, description: 'Document attestant de votre numéro de TVA' },
  { value: 'bank_statement', label: 'Relevé d\'identité bancaire', required: true, description: 'RIB officiel de votre établissement bancaire' },
  { value: 'insurance_certificate', label: 'Attestation d\'assurance', required: false, description: 'Attestation de responsabilité civile professionnelle' },
  { value: 'product_certification', label: 'Certification des produits', required: false, description: 'Certifications spécifiques à vos produits (si applicable)' }
];

export default function DocumentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoStatus, setInfoStatus] = useState<'draft' | 'pending' | 'validated'>('draft');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDocType, setCurrentDocType] = useState<string>('');
  
  // État pour les documents
  const [documents, setDocuments] = useState<Document[]>([]);

  // Charger les documents existants au chargement de la page
  useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        setLoading(true);
        
        // Récupérer les documents depuis l'API
        const response = await fetch('/api/vendors/documents');
        
        if (response.ok) {
          const data = await response.json();
          
          // Déterminer le statut global des documents
          if (data.status) {
            setInfoStatus(data.status);
          } else if (data.submittedAt) {
            setInfoStatus('pending');
          }
          
          if (data.documents) {
            setDocuments(data.documents);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingDocuments();
  }, []);

  // Formater la taille d'un fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' octets';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Gérer l'upload d'un document
  const handleFileUpload = (type: string) => {
    setCurrentDocType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Gérer la sélection d'un fichier
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentDocType) return;
    
    const file = files[0];
    
    // Vérifier la taille du fichier (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Le fichier est trop volumineux. La taille maximale est de 5 Mo.');
      return;
    }
    
    // Vérifier le type du fichier (PDF, JPG, PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Format de fichier non pris en charge. Veuillez utiliser PDF, JPG ou PNG.');
      return;
    }
    
    // Créer un nouvel objet document
    const newDocument: Document = {
      id: Date.now().toString(),
      type: currentDocType,
      name: file.name,
      uploadDate: new Date().toISOString(),
      size: file.size,
      status: null,
      file
    };
    
    // Vérifier si un document de ce type existe déjà
    const existingDocIndex = documents.findIndex(doc => doc.type === currentDocType);
    
    if (existingDocIndex >= 0) {
      // Remplacer le document existant
      const updatedDocuments = [...documents];
      updatedDocuments[existingDocIndex] = newDocument;
      setDocuments(updatedDocuments);
    } else {
      // Ajouter le nouveau document
      setDocuments([...documents, newDocument]);
    }
    
    // Réinitialiser le formulaire
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Afficher un message de succès
    setSuccessMessage(`Le document "${documentTypes.find(d => d.value === currentDocType)?.label}" a été téléchargé avec succès.`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Supprimer un document
  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Télécharger un document
  const handleDownloadDocument = (document: Document) => {
    // Simuler le téléchargement d'un document
    alert(`Téléchargement du document ${document.name}`);
  };

  // Vérifier si tous les documents requis sont présents
  const areRequiredDocumentsUploaded = () => {
    const requiredTypes = documentTypes.filter(type => type.required).map(type => type.value);
    const uploadedTypes = documents.map(doc => doc.type);
    
    return requiredTypes.every(type => uploadedTypes.includes(type));
  };

  // Soumettre les documents à l'administrateur pour validation
  const handleSubmitDocuments = async () => {
    if (!areRequiredDocumentsUploaded()) {
      setFormError('Veuillez télécharger tous les documents requis avant de soumettre.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Envoyer les documents au serveur
      for (const doc of documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('type', doc.type);
          formData.append('name', doc.name);
          
          await fetch('/api/vendors/upload-document', {
            method: 'POST',
            body: formData
          });
        }
      }
      
      // Mettre à jour le statut
      const response = await fetch('/api/vendors/submit-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'pending',
          submittedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi des documents');
      }
      
      // Mettre à jour le statut local
      setInfoStatus('pending');
      setSuccessMessage('Documents envoyés avec succès à l\'administrateur pour validation');
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission des documents:', error);
      setFormError('Une erreur est survenue lors de l\'envoi de vos documents. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir le texte du bouton en fonction du statut
  const getButtonText = () => {
    switch (infoStatus) {
      case 'draft':
        return 'Envoyer tous les documents';
      case 'pending':
        return 'En attente de validation';
      case 'validated':
        return 'Documents validés';
      default:
        return 'Envoyer tous les documents';
    }
  };

  // Obtenir le statut d'un document
  const getDocumentStatus = (status: 'pending' | 'validated' | 'rejected' | null) => {
    if (!status) return 'Non vérifié';
    
    switch (status) {
      case 'pending':
        return 'En cours de vérification';
      case 'validated':
        return 'Vérifié';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Non vérifié';
    }
  };

  // Obtenir la couleur du statut d'un document
  const getDocumentStatusColor = (status: 'pending' | 'validated' | 'rejected' | null) => {
    if (!status) return 'text-gray-500';
    
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'validated':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/parametres/entreprise" className="mr-4 text-gray-500 hover:text-gray-700">
          <FiArrowLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl font-semibold">Documents légaux</h1>
      </div>
      
      {formError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-center items-center h-40">
          <p className="text-gray-500">Chargement de vos documents...</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-lg font-medium mb-4">Documents requis</h2>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <p className="text-sm text-blue-700">
                <FiInfo className="inline-block mr-2" />
                Veuillez télécharger tous les documents requis pour compléter votre inscription. 
                Les documents seront vérifiés par notre équipe avant d'être validés.
              </p>
            </div>
            
            {/* Input file caché */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelected}
            />
            
            <div className="space-y-6">
              {documentTypes.map(docType => {
                const uploadedDoc = documents.find(doc => doc.type === docType.value);
                
                return (
                  <div key={docType.value} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {docType.label} {docType.required && <span className="text-red-500">*</span>}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{docType.description}</p>
                      </div>
                      
                      {uploadedDoc ? (
                        <div className={`text-sm ${getDocumentStatusColor(uploadedDoc.status)}`}>
                          {getDocumentStatus(uploadedDoc.status)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Non téléchargé
                        </div>
                      )}
                    </div>
                    
                    {uploadedDoc ? (
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center">
                          <FiFile className="text-blue-500 mr-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{uploadedDoc.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedDoc.size)} • Téléchargé le {formatDate(uploadedDoc.uploadDate)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(uploadedDoc)}
                              className="text-gray-500 hover:text-gray-700"
                              disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                            >
                              <FiDownload />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(uploadedDoc.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleFileUpload(docType.value)}
                        className="mt-4 flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        disabled={infoStatus === 'pending' || infoStatus === 'validated'}
                      >
                        <FiUpload className="mr-2" />
                        Télécharger
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSubmitDocuments}
                disabled={loading || !areRequiredDocumentsUploaded() || infoStatus === 'pending' || infoStatus === 'validated'}
                className={`flex items-center px-6 py-2 rounded-md ${loading || !areRequiredDocumentsUploaded() || infoStatus === 'pending' || infoStatus === 'validated' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {loading ? 'Envoi en cours...' : getButtonText()}
                {!loading && infoStatus === 'validated' && <FiCheck className="ml-2" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
