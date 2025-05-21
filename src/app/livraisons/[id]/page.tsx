"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Phone, Truck, Package, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { shipments } from "@/lib/mockData";
import { getShipmentMethodLabel, getShipmentStatusLabel, getShipmentStatusColor, formatPhoneNumber } from "@/lib/utils";

export default function LivraisonDetailPage({ params }: { params: { id: string } }) {
  // Trouver la livraison correspondante
  const shipment = shipments.find((s) => s.id === params.id);

  // Si la livraison n'existe pas, afficher une page 404
  if (!shipment) {
    notFound();
  }

  const { bg, text } = getShipmentStatusColor(shipment.status);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/livraisons">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Détails de la livraison</h1>
          <Badge className={`ml-4 ${bg} ${text}`}>
            {getShipmentStatusLabel(shipment.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations de commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de commande</p>
                  <p className="font-medium">#{shipment.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numéro de suivi</p>
                  <p className="font-medium">{shipment.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de commande</p>
                  <p className="font-medium">{new Date(shipment.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                  <p className="font-medium">{new Date(shipment.lastUpdate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Méthode de livraison</p>
                  <p className="font-medium">{getShipmentMethodLabel(shipment.shippingMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transporteur</p>
                  <p className="font-medium">{shipment.carrier || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{shipment.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{shipment.customer.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatPhoneNumber(shipment.customer.phone)}</p>
              </div>

              {shipment.shippingMethod === "home_delivery" && (
                <div>
                  <div className="flex items-start gap-2 mt-4">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Adresse de livraison</p>
                      <p className="text-sm text-muted-foreground">{shipment.deliveryAddress.street}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.deliveryAddress.zipCode} {shipment.deliveryAddress.city}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {shipment.shippingMethod === "store_pickup" && (
                <div>
                  <div className="flex items-start gap-2 mt-4">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Boutique de retrait</p>
                      <p className="text-sm text-muted-foreground">{shipment.storeLocation}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Articles commandés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.reference}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unitPrice.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{(item.quantity * item.unitPrice).toFixed(2)} €</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell className="text-right font-medium">Sous-total</TableCell>
                  <TableCell className="text-right font-medium">
                    {shipment.items
                      .reduce((total, item) => total + item.quantity * item.unitPrice, 0)
                      .toFixed(2)} €
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell className="text-right font-medium">Frais de livraison</TableCell>
                  <TableCell className="text-right font-medium">{shipment.shippingCost.toFixed(2)} €</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {(
                      shipment.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0) +
                      shipment.shippingCost
                    ).toFixed(2)} €
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-border space-y-8">
              {shipment.statusHistory.map((status, index) => (
                <div key={index} className="relative mb-4">
                  <div className="absolute -left-[25px] w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full ${getShipmentStatusColor(status.status).bg}`}></div>
                  </div>
                  <div className="ml-6">
                    <p className="font-medium">{getShipmentStatusLabel(status.status)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(status.timestamp).toLocaleString()}
                    </p>
                    {status.comment && (
                      <p className="text-sm mt-2">{status.comment}</p>
                    )}
                  </div>
                  {index < shipment.statusHistory.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Link href="/livraisons">
            <Button variant="outline">Retour à la liste</Button>
          </Link>
          
          {/* Boutons d'action basés sur le statut actuel */}
          {shipment.status === "prepared" && (
            <Button>Marquer comme expédié</Button>
          )}
          {shipment.status === "in_transit" && (
            <Button>Marquer comme livré</Button>
          )}
          {shipment.status === "ready_for_pickup" && (
            <Button>Marquer comme retiré</Button>
          )}
        </div>
      </div>
    </div>
  );
} 