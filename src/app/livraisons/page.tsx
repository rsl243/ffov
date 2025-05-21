"use client";

import { useState, useEffect } from "react";
import { Shipment, normalizeShipment } from "@/lib/types/shipment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getShipments, updateShipmentStatus, getShipmentsStats, generatePickupCode, createShipmentFromOrder } from "@/lib/shipmentsService";
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Variable globale pour la compatibilité avec le code existant
export let globalShipments: Shipment[] = [];

// Fonction pour ajouter une nouvelle expédition (compatible avec l'API existante)
export async function addShipment(shipment: any) {
  try {
    // Extraire les informations nécessaires du paramètre shipment
    const orderId = shipment.orderId;
    const shippingMethod = shipment.shippingMethod;
    const customerInfo = {
      name: shipment.customer?.firstName && shipment.customer?.lastName 
        ? `${shipment.customer.firstName} ${shipment.customer.lastName}` 
        : shipment.customer?.name || 'Client inconnu',
      phone: shipment.customer?.phone || '',
      email: shipment.customer?.email || ''
    };
    const shippingAddress = shipment.address 
      ? `${shipment.address.street}, ${shipment.address.postalCode} ${shipment.address.city}, ${shipment.address.country}` 
      : shipment.shippingAddress || '';
    const storeLocation = shipment.store?.name || '';
    
    // Créer la livraison dans Supabase
    const shipmentId = await createShipmentFromOrder(
      orderId,
      shippingMethod,
      customerInfo,
      shippingAddress,
      storeLocation
    );
    
    // Notifier les autres composants si la création a réussi
    if (shipmentId && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('shipments-updated'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'expédition:', error);
    return false;
  }
}

export default function LivraisonsPage() {
  // État et hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [stats, setStats] = useState({
    prepared: 0,
    in_transit: 0,
    delivered: 0,
    ready_for_pickup: 0,
    picked_up: 0,
    canceled: 0,
    total: 0
  });
  
  // États pour les modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [updateComment, setUpdateComment] = useState("");
  const [pickupCode, setPickupCode] = useState("");
  const [pickupCodeError, setPickupCodeError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Récupérer l'onglet actif depuis l'URL au chargement
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["all", "pending", "in_transit", "ready_for_pickup", "delivered"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  // Charger les livraisons depuis Supabase
  useEffect(() => {
    if (authLoading || !user) return;
    
    const loadShipments = async () => {
      setLoading(true);
      try {
        // Convertir l'onglet actif en statut pour la requête
        let status: any;
        switch (activeTab) {
          case "pending":
            status = "prepared";
            break;
          case "in_transit":
            status = "in_transit";
            break;
          case "ready_for_pickup":
            status = "ready_for_pickup";
            break;
          case "delivered":
            status = "delivered";
            break;
          default:
            status = "all";
        }
        
        // Récupérer les livraisons
        const result = await getShipments(
          currentPage,
          pageSize,
          status
        );
        
        setShipments(result.shipments);
        setTotalPages(result.totalPages);
        
        // Récupérer les statistiques
        const statsResult = await getShipmentsStats();
        setStats(statsResult);
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons:', error);
        setErrorMessage('Erreur lors du chargement des livraisons. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    loadShipments();
    
    // Écouter les mises à jour des expéditions
    const handleShipmentUpdate = () => {
      loadShipments();
    };
    
    window.addEventListener('shipments-updated', handleShipmentUpdate);
    return () => {
      window.removeEventListener('shipments-updated', handleShipmentUpdate);
    };
  }, [authLoading, user, activeTab, currentPage, pageSize]);

  // Changer d'onglet
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/livraisons?tab=${tab}`);
  };

  // Les livraisons sont déjà filtrées par l'API en fonction de l'onglet actif
  const getFilteredShipments = () => {
    // Si les données sont en cours de chargement, retourner un tableau vide
    if (loading) {
      return [];
    }
    return shipments;
  };

  // Utiliser les statistiques réelles pour les compteurs
  const counts = {
    all: stats.total,
    pending: stats.prepared,
    in_transit: stats.in_transit,
    ready_for_pickup: stats.ready_for_pickup,
    delivered: stats.delivered + stats.picked_up,
  };

  // Mettre à jour le statut d'une expédition avec Supabase
  const handleUpdateShipmentStatus = async (newStatus: string) => {
    if (!selectedShipment) return;
    
    try {
      // Préparer le commentaire pour l'historique
      const comment = updateComment || `Statut mis à jour vers ${getStatusLabel(newStatus)}`;
      
      // Déterminer l'emplacement en fonction du statut
      let location = '';
      if (newStatus === 'in_transit') {
        location = 'En transit';
      } else if (newStatus === 'delivered') {
        location = selectedShipment.shippingAddress || 'Adresse de livraison';
      } else if (newStatus === 'ready_for_pickup' || newStatus === 'picked_up') {
        location = selectedShipment.storeLocation || 'Boutique';
      } else if (newStatus === 'canceled') {
        location = 'Annulation';
      }
      
      // Appeler l'API pour mettre à jour le statut
      const success = await updateShipmentStatus(
        selectedShipment.id,
        newStatus as any,
        comment,
        location
      );
      
      if (success) {
        // Recharger les données après la mise à jour
        const result = await getShipments(
          currentPage,
          pageSize,
          activeTab === 'all' ? undefined : activeTab as any
        );
        
        setShipments(result.shipments);
        
        // Mettre à jour les statistiques
        const statsResult = await getShipmentsStats();
        setStats(statsResult);
        
        // Afficher un message de succès
        setSuccessMessage(`Statut mis à jour avec succès vers "${getStatusLabel(newStatus)}"`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setErrorMessage('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      // Fermer les modals et réinitialiser les états
      setShowUpdateModal(false);
      setShowPickupModal(false);
      setShowCancelModal(false);
      setSelectedShipment(null);
      setTrackingNumber("");
      setCarrier("");
      setUpdateComment("");
      setPickupCode("");
      setPickupCodeError("");
      setCancelReason("");
    }
  };

  // Valider le code de retrait avec Supabase
  const validatePickupCode = () => {
    if (!selectedShipment) return;
    
    // Vérifier si le code saisi correspond au code de retrait
    // Utiliser la propriété pickupCode si elle existe, sinon utiliser une chaîne vide
    const shipmentPickupCode = selectedShipment.pickupCode || '';
    
    if (pickupCode === shipmentPickupCode) {
      // Code valide, mettre à jour le statut
      handleUpdateShipmentStatus("picked_up");
    } else {
      // Code invalide, afficher une erreur
      setPickupCodeError("Code de retrait incorrect. Veuillez vérifier et réessayer.");
    }
  };

  // Ouvrir la modal pour mettre à jour le statut
  const openUpdateModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setTrackingNumber(shipment.trackingNumber);
    setCarrier(shipment.carrier);
    setUpdateComment("");
    setShowUpdateModal(true);
  };

  // Ouvrir la modal pour valider un retrait
  const openPickupModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setPickupCode("");
    setPickupCodeError("");
    setShowPickupModal(true);
  };

  // Ouvrir la modal pour annuler une commande
  const openCancelModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setCancelReason("");
    setShowCancelModal(true);
  };

  // Déterminer le prochain statut possible
  const getNextStatus = (shipment: Shipment): { status: string, label: string, requiresTracking?: boolean } | null => {
    const currentStatus = shipment.currentStatus;
    
    // Si c'est un retrait en magasin (store_pickup) et qu'il est en préparation
    if (currentStatus === "processing" && shipment.shippingMethod === "store_pickup") {
      return { status: "ready_for_pickup", label: "Marquer prêt à retirer" };
    }
    
    // Pour les autres cas, suivre la logique normale
    switch (currentStatus) {
      case "pending":
        return { status: "processing", label: "Marquer en préparation" };
      case "processing":
        return { status: "in_transit", label: "Marquer en transit", requiresTracking: true };
      case "in_transit":
        return { status: "delivered", label: "Marquer comme livré" };
      case "ready_for_pickup":
        return null; // Pas de statut suivant automatique, il faut valider avec un code
      default:
        return null;
    }
  };

  // Fonctions de formatage et d'affichage
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "prepared":
        return "bg-indigo-100 text-indigo-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "ready_for_pickup":
        return "bg-cyan-100 text-cyan-800";
      case "delivered":
      case "picked_up":
        return "bg-green-100 text-green-800";
      case "failed_delivery":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getShippingMethodLabel = (method: string) => {
    switch (method) {
      case "home_delivery":
        return "Livraison à domicile";
      case "express":
        return "Livraison express";
      case "relay_point":
        return "Point relais";
      case "store_pickup":
        return "Retrait en magasin";
      default:
        return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "processing":
        return "En préparation";
      case "prepared":
        return "Préparé";
      case "in_transit":
        return "En cours de livraison";
      case "ready_for_pickup":
        return "Prêt pour retrait";
      case "delivered":
        return "Livré";
      case "picked_up":
        return "Récupéré en magasin";
      case "failed_delivery":
        return "Échec de livraison";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Rendu d'une carte d'expédition
  const renderShipmentCard = (shipment: Shipment) => {
    const nextStatus = getNextStatus(shipment);
    
    return (
      <Card key={shipment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              <Link href={`/livraisons/${shipment.id}`} className="hover:text-blue-600 transition-colors">
              Commande #{shipment.orderId}
              </Link>
            </CardTitle>
            <Badge className={getStatusBadgeColor(shipment.currentStatus)}>
              {getStatusLabel(shipment.currentStatus)}
            </Badge>
          </div>
          <CardDescription>
            <span className="flex items-center gap-4 mt-1">
              <span>{formatDate(shipment.orderDate)}</span>
              <span className="font-medium">{shipment.trackingNumber}</span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Client</h4>
              <p>
                {shipment.customer.firstName} {shipment.customer.lastName}
              </p>
              <p className="text-sm text-gray-500">{shipment.customer.email}</p>
              <p className="text-sm text-gray-500">{shipment.customer.phone}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Livraison</h4>
              <p>{getShippingMethodLabel(shipment.shippingMethod)}</p>
              
              {shipment.shippingMethod === "home_delivery" && shipment.deliveryAddress && (
                <p className="text-sm text-gray-500">
                  {shipment.deliveryAddress.street}, {shipment.deliveryAddress.postalCode}{" "}
                  {shipment.deliveryAddress.city}
                </p>
              )}
              
              {shipment.shippingMethod === "relay_point" && shipment.relayPoint && (
                <p className="text-sm text-gray-500">
                  {shipment.relayPoint.name}, {shipment.relayPoint.address.street}
                </p>
              )}
              
              {shipment.shippingMethod === "store_pickup" && shipment.store && (
                <p className="text-sm text-gray-500">
                  {shipment.store.name}, {shipment.store.address.city}
                </p>
              )}
              
              <p className="text-sm text-gray-500">
                {shipment.carrier !== "N/A" ? `Transporteur: ${shipment.carrier}` : ""}
              </p>
              
              {/* Afficher le code de retrait pour les commandes prêtes à retirer (uniquement visible par le vendeur) */}
              {shipment.currentStatus === "ready_for_pickup" && shipment.shippingMethod === "store_pickup" && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-700">Code de retrait: <span className="font-bold">{shipment.pickupCode}</span></p>
                  <p className="text-xs text-blue-600 mt-1">À communiquer au client lors du retrait</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Produits ({shipment.items.length})</h4>
            <ul className="space-y-2">
              {shipment.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">{item.totalPrice.toFixed(2)} €</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-3 pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-bold">{shipment.totalAmount.toFixed(2)} €</span>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Historique</h4>
            <ul className="space-y-1">
              {shipment.statusHistory.map((entry, index) => (
                <li key={index} className="text-sm flex items-start">
                  <span className="text-gray-500 min-w-[140px]">
                    {formatDate(entry.timestamp).split(" à ")[0]}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge className={`${getStatusBadgeColor(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </Badge>
                    {entry.comment && <span>{entry.comment}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {shipment.estimatedDeliveryDate && (
            <div className="mt-4">
              <p className="text-sm flex items-center gap-1">
                <span className="font-medium">Livraison estimée :</span>
                <span>{formatDate(shipment.estimatedDeliveryDate)}</span>
              </p>
            </div>
          )}
          
          {shipment.actualDeliveryDate && (
            <div className="mt-1">
              <p className="text-sm flex items-center gap-1">
                <span className="font-medium">
                  {shipment.currentStatus === "picked_up" ? "Récupéré le :" : "Livré le :"}
                </span>
                <span>{formatDate(shipment.actualDeliveryDate)}</span>
              </p>
            </div>
          )}
          
          {/* Boutons d'action spécifiques selon le statut */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {/* Bouton pour changer au statut suivant (pour les commandes non terminées) */}
            {nextStatus && (
              <button 
                onClick={() => openUpdateModal(shipment)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                {nextStatus.label}
              </button>
            )}
            
            {/* Boutons spécifiques pour les commandes prêtes à retirer */}
            {shipment.currentStatus === "ready_for_pickup" && (
              <>
                <button 
                  onClick={() => openPickupModal(shipment)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Valider retrait
                </button>
                
                <button 
                  onClick={() => openCancelModal(shipment)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredShipments = getFilteredShipments();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Suivi des livraisons</h1>
      
      {/* Messages de notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50">
          {errorMessage}
        </div>
      )}
      
      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange("all")}
            className={`pb-4 px-1 ${
              activeTab === "all"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Toutes ({counts.all})
          </button>
          <button
            onClick={() => handleTabChange("pending")}
            className={`pb-4 px-1 ${
              activeTab === "pending"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            En préparation ({counts.pending})
          </button>
          <button
            onClick={() => handleTabChange("in_transit")}
            className={`pb-4 px-1 ${
              activeTab === "in_transit"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            En transit ({counts.in_transit})
          </button>
          <button
            onClick={() => handleTabChange("ready_for_pickup")}
            className={`pb-4 px-1 ${
              activeTab === "ready_for_pickup"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            À retirer ({counts.ready_for_pickup})
          </button>
          <button
            onClick={() => handleTabChange("delivered")}
            className={`pb-4 px-1 ${
              activeTab === "delivered"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Livrées ({counts.delivered})
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div>
        {filteredShipments.length > 0 ? (
          filteredShipments.map(renderShipmentCard)
        ) : (
          <p className="text-center py-8 text-gray-500">
            {activeTab === "all" && "Aucune livraison trouvée"}
            {activeTab === "pending" && "Aucune livraison en préparation"}
            {activeTab === "in_transit" && "Aucune livraison en transit"}
            {activeTab === "ready_for_pickup" && "Aucune livraison à retirer"}
            {activeTab === "delivered" && "Aucune livraison terminée"}
          </p>
        )}
      </div>
      
      {/* Modal pour mise à jour du statut */}
      {showUpdateModal && selectedShipment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowUpdateModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {getNextStatus(selectedShipment)?.label || "Mettre à jour le statut"}
                    </h3>
                    
                    <div className="mt-4">
                      {/* Formulaire spécifique pour le passage en transit (uniquement pour les livraisons à domicile) */}
                      {selectedShipment.currentStatus === "processing" && selectedShipment.shippingMethod !== "store_pickup" && (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700">
                              Numéro de suivi
                            </label>
                            <input
                              type="text"
                              id="trackingNumber"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Ex: TN123456789FR"
                              required
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                              Transporteur
                            </label>
                            <select
                              id="carrier"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                              value={carrier}
                              onChange={(e) => setCarrier(e.target.value)}
                              required
                            >
                              <option value="">Sélectionnez un transporteur</option>
                              <option value="Chronopost">Chronopost</option>
                              <option value="DPD">DPD</option>
                              <option value="Colissimo">Colissimo</option>
                              <option value="UPS">UPS</option>
                              <option value="FedEx">FedEx</option>
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Message informatif pour les retraits en magasin */}
                      {selectedShipment.currentStatus === "processing" && selectedShipment.shippingMethod === "store_pickup" && (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
                            <p>
                              <strong>Retrait en magasin:</strong> En confirmant cette action, vous indiquez que la commande est prête à être retirée par le client.
                            </p>
                            <p className="text-sm mt-2">
                              Boutique: {selectedShipment.store?.name || "Non spécifiée"}
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Code de retrait:</strong> {selectedShipment.pickupCode || "Non généré"}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Ce code sera nécessaire pour le client lors du retrait.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Commentaire (pour tous les statuts) */}
                      <div className="mt-4">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                          Commentaire (optionnel)
                        </label>
                        <textarea
                          id="comment"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={updateComment}
                          onChange={(e) => setUpdateComment(e.target.value)}
                          placeholder="Informations complémentaires..."
                        />
                      </div>
                      
                      {/* Résumé de la commande */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium mb-2 text-sm">Résumé de la commande</h4>
                        <p className="text-sm text-gray-600">Client: {selectedShipment.customer.firstName} {selectedShipment.customer.lastName}</p>
                        <p className="text-sm text-gray-600">Commande: #{selectedShipment.orderId}</p>
                        <p className="text-sm text-gray-600">Statut actuel: {getStatusLabel(selectedShipment.currentStatus)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    const nextStatus = getNextStatus(selectedShipment);
                    if (nextStatus) {
                      // Vérifier si les champs obligatoires sont remplis pour le passage en transit
                      if (nextStatus.requiresTracking && (!trackingNumber || !carrier) && selectedShipment.shippingMethod !== "store_pickup") {
                        alert("Veuillez remplir le numéro de suivi et sélectionner un transporteur.");
                        return;
                      }
                      updateShipmentStatus(nextStatus.status);
                    }
                  }}
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour valider un retrait */}
      {showPickupModal && selectedShipment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPickupModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Valider le retrait
                    </h3>
                    
                    <div className="mt-4">
                      <div className="bg-blue-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-blue-700">
                          <strong>Information:</strong> Demandez au client de vous fournir le code de retrait qui lui a été envoyé.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="pickupCode" className="block text-sm font-medium text-gray-700">
                            Code de retrait
                          </label>
                          <input
                            type="text"
                            id="pickupCode"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={pickupCode}
                            onChange={(e) => {
                              setPickupCode(e.target.value);
                              setPickupCodeError("");
                            }}
                            placeholder="Entrez le code à 6 chiffres"
                            required
                          />
                          {pickupCodeError && (
                            <p className="mt-1 text-sm text-red-600">{pickupCodeError}</p>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <label htmlFor="pickupComment" className="block text-sm font-medium text-gray-700">
                            Commentaire (optionnel)
                          </label>
                          <textarea
                            id="pickupComment"
                            rows={2}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={updateComment}
                            onChange={(e) => setUpdateComment(e.target.value)}
                            placeholder="Informations supplémentaires..."
                          />
                        </div>
                      </div>
                      
                      {/* Résumé de la commande */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium mb-2 text-sm">Résumé de la commande</h4>
                        <p className="text-sm text-gray-600">Client: {selectedShipment.customer.firstName} {selectedShipment.customer.lastName}</p>
                        <p className="text-sm text-gray-600">Commande: #{selectedShipment.orderId}</p>
                        <p className="text-sm text-gray-600">Boutique: {selectedShipment.store?.name || "Non spécifiée"}</p>
                        
                        {/* Pour rappel, affichons le code de retrait qui devrait être fourni (uniquement visible pour le vendeur) */}
                        <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-300">
                          <p className="text-xs text-gray-500">Pour information (code à comparer):</p>
                          <p className="text-sm font-medium">{selectedShipment.pickupCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={validatePickupCode}
                >
                  Valider le retrait
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowPickupModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour annuler une commande */}
      {showCancelModal && selectedShipment && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowCancelModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Annuler la commande
                    </h3>
                    
                    <div className="mt-4">
                      <div className="bg-red-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-red-700">
                          <strong>Attention:</strong> L'annulation d'une commande prête à retirer est une action définitive. Cette commande sera marquée comme annulée.
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">
                          Motif d'annulation
                        </label>
                        <select
                          id="cancelReason"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          required
                        >
                          <option value="">Sélectionnez un motif</option>
                          <option value="client_no_show">Client ne s'est pas présenté</option>
                          <option value="client_request">À la demande du client</option>
                          <option value="stock_issue">Problème de stock</option>
                          <option value="item_damaged">Article endommagé</option>
                          <option value="other">Autre raison</option>
                        </select>
                      </div>
                      
                      {cancelReason === "other" && (
                        <div className="mt-3">
                          <label htmlFor="cancelComment" className="block text-sm font-medium text-gray-700">
                            Précisez le motif
                          </label>
                          <textarea
                            id="cancelComment"
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={updateComment}
                            onChange={(e) => setUpdateComment(e.target.value)}
                            placeholder="Détaillez la raison de l'annulation..."
                            required={cancelReason === "other"}
                          />
                        </div>
                      )}
                      
                      {/* Résumé de la commande */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium mb-2 text-sm">Résumé de la commande</h4>
                        <p className="text-sm text-gray-600">Client: {selectedShipment.customer.firstName} {selectedShipment.customer.lastName}</p>
                        <p className="text-sm text-gray-600">Commande: #{selectedShipment.orderId}</p>
                        <p className="text-sm text-gray-600">Produits: {selectedShipment.items.length}</p>
                        <p className="text-sm text-gray-600">Total: {selectedShipment.totalAmount.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    if (!cancelReason) {
                      setErrorMessage("Veuillez sélectionner un motif d'annulation");
                      setTimeout(() => setErrorMessage(""), 3000);
                      return;
                    }
                    
                    if (cancelReason === "other" && !updateComment) {
                      setErrorMessage("Veuillez préciser le motif d'annulation");
                      setTimeout(() => setErrorMessage(""), 3000);
                      return;
                    }
                    
                    updateShipmentStatus("cancelled");
                  }}
                >
                  Confirmer l'annulation
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCancelModal(false)}
                >
                  Retour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 