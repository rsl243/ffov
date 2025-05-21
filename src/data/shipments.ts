import { Shipment } from "../types";

export const shipments: Shipment[] = [
  {
    id: "ship_1",
    orderId: "ord_89715",
    orderDate: "2023-11-15T10:30:00Z",
    trackingNumber: "FBE78954214FR",
    currentStatus: "in_transit",
    statusHistory: [
      {
        status: "pending",
        timestamp: "2023-11-15T10:35:00Z",
        comment: "Commande reçue"
      },
      {
        status: "processing",
        timestamp: "2023-11-16T09:15:00Z",
        comment: "Préparation en cours"
      },
      {
        status: "prepared",
        timestamp: "2023-11-16T14:20:00Z",
        comment: "Colis prêt pour expédition"
      },
      {
        status: "in_transit",
        timestamp: "2023-11-17T08:45:00Z",
        comment: "Pris en charge par le transporteur"
      }
    ],
    customer: {
      id: "cust_12345",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      phone: "0645789632"
    },
    shippingMethod: "home_delivery",
    deliveryAddress: {
      street: "123 Rue de Paris",
      city: "Lyon",
      postalCode: "69001",
      country: "France"
    },
    carrier: "Chronopost",
    estimatedDeliveryDate: "2023-11-20T00:00:00Z",
    items: [
      {
        id: "item_1",
        productId: "prod_7845",
        name: "Téléviseur Samsung 55 pouces",
        sku: "TV-SAM-55-2023",
        quantity: 1,
        unitPrice: 699.99,
        totalPrice: 699.99,
        imageUrl: "/images/products/tv-samsung-55.jpg"
      },
      {
        id: "item_2",
        productId: "prod_1256",
        name: "Support mural TV universel",
        sku: "ACC-TV-MNT-001",
        quantity: 1,
        unitPrice: 49.99,
        totalPrice: 49.99,
        imageUrl: "/images/products/tv-mount.jpg"
      }
    ],
    subtotal: 749.98,
    shippingCost: 9.99,
    totalAmount: 759.97,
    lastUpdated: "2023-11-17T08:45:00Z"
  },
  {
    id: "ship_2",
    orderId: "ord_92365",
    orderDate: "2023-11-10T15:45:00Z",
    trackingNumber: "FBE65325698FR",
    currentStatus: "delivered",
    statusHistory: [
      {
        status: "pending",
        timestamp: "2023-11-10T15:50:00Z",
        comment: "Commande reçue"
      },
      {
        status: "processing",
        timestamp: "2023-11-11T08:30:00Z",
        comment: "Préparation en cours"
      },
      {
        status: "prepared",
        timestamp: "2023-11-11T11:15:00Z",
        comment: "Colis prêt pour expédition"
      },
      {
        status: "in_transit",
        timestamp: "2023-11-12T09:20:00Z",
        comment: "Pris en charge par le transporteur"
      },
      {
        status: "delivered",
        timestamp: "2023-11-14T14:25:00Z",
        comment: "Livré avec succès"
      }
    ],
    customer: {
      id: "cust_54321",
      firstName: "Marie",
      lastName: "Martin",
      email: "marie.martin@example.com",
      phone: "0678451236"
    },
    shippingMethod: "home_delivery",
    deliveryAddress: {
      street: "45 Avenue Victor Hugo",
      city: "Paris",
      postalCode: "75016",
      country: "France",
      additionalInfo: "Code: 1234, 3ème étage droite"
    },
    carrier: "DPD",
    estimatedDeliveryDate: "2023-11-15T00:00:00Z",
    actualDeliveryDate: "2023-11-14T14:25:00Z",
    items: [
      {
        id: "item_3",
        productId: "prod_3698",
        name: "Macbook Pro 14 pouces",
        sku: "MB-PRO-14-M2",
        quantity: 1,
        unitPrice: 1999.99,
        totalPrice: 1999.99,
        imageUrl: "/images/products/macbook-pro-14.jpg"
      }
    ],
    subtotal: 1999.99,
    shippingCost: 0,
    totalAmount: 1999.99,
    lastUpdated: "2023-11-14T14:25:00Z"
  },
  {
    id: "ship_3",
    orderId: "ord_75698",
    orderDate: "2023-11-18T12:10:00Z",
    trackingNumber: "FBE23651478FR",
    currentStatus: "ready_for_pickup",
    statusHistory: [
      {
        status: "pending",
        timestamp: "2023-11-18T12:15:00Z",
        comment: "Commande reçue"
      },
      {
        status: "processing",
        timestamp: "2023-11-19T10:25:00Z",
        comment: "Préparation en cours"
      },
      {
        status: "prepared",
        timestamp: "2023-11-19T15:30:00Z",
        comment: "Colis prêt pour expédition"
      },
      {
        status: "in_transit",
        timestamp: "2023-11-20T08:45:00Z",
        comment: "Pris en charge par le transporteur"
      },
      {
        status: "ready_for_pickup",
        timestamp: "2023-11-21T10:20:00Z",
        comment: "Disponible au point relais"
      }
    ],
    customer: {
      id: "cust_87569",
      firstName: "Sophie",
      lastName: "Dubois",
      email: "sophie.dubois@example.com",
      phone: "0712365478"
    },
    shippingMethod: "relay_point",
    relayPoint: {
      id: "relay_125",
      name: "Tabac Presse du Centre",
      address: {
        street: "56 Rue de la République",
        city: "Marseille",
        postalCode: "13002",
        country: "France"
      },
      phone: "0491234567",
      openingHours: "Lun-Sam: 7h-20h, Dim: 9h-12h"
    },
    carrier: "Mondial Relay",
    estimatedDeliveryDate: "2023-11-22T00:00:00Z",
    items: [
      {
        id: "item_4",
        productId: "prod_4521",
        name: "Casque Sony WH-1000XM5",
        sku: "AUDIO-SONY-WH1000XM5",
        quantity: 1,
        unitPrice: 399.99,
        totalPrice: 399.99,
        imageUrl: "/images/products/sony-wh1000xm5.jpg"
      },
      {
        id: "item_5",
        productId: "prod_2136",
        name: "Étui de protection casque",
        sku: "ACC-CASE-HP-01",
        quantity: 1,
        unitPrice: 29.99,
        totalPrice: 29.99,
        imageUrl: "/images/products/headphone-case.jpg"
      }
    ],
    subtotal: 429.98,
    shippingCost: 4.99,
    totalAmount: 434.97,
    lastUpdated: "2023-11-21T10:20:00Z"
  },
  {
    id: "ship_4",
    orderId: "ord_68753",
    orderDate: "2023-11-12T09:30:00Z",
    trackingNumber: "FBE96325874FR",
    currentStatus: "cancelled",
    statusHistory: [
      {
        status: "pending",
        timestamp: "2023-11-12T09:35:00Z",
        comment: "Commande reçue"
      },
      {
        status: "processing",
        timestamp: "2023-11-13T11:20:00Z",
        comment: "Préparation en cours"
      },
      {
        status: "cancelled",
        timestamp: "2023-11-14T16:45:00Z",
        comment: "Annulé à la demande du client"
      }
    ],
    customer: {
      id: "cust_36521",
      firstName: "Lucas",
      lastName: "Petit",
      email: "lucas.petit@example.com",
      phone: "0689745632"
    },
    shippingMethod: "express",
    deliveryAddress: {
      street: "78 Avenue des Champs-Élysées",
      city: "Paris",
      postalCode: "75008",
      country: "France"
    },
    carrier: "UPS Express",
    items: [
      {
        id: "item_6",
        productId: "prod_9874",
        name: "iPhone 15 Pro Max 256Go",
        sku: "APL-IP15PM-256",
        quantity: 1,
        unitPrice: 1459.99,
        totalPrice: 1459.99,
        imageUrl: "/images/products/iphone-15-pro-max.jpg"
      }
    ],
    subtotal: 1459.99,
    shippingCost: 19.99,
    totalAmount: 1479.98,
    lastUpdated: "2023-11-14T16:45:00Z"
  },
  {
    id: "ship_5",
    orderId: "ord_35214",
    orderDate: "2023-11-19T14:20:00Z",
    trackingNumber: "FBE45698712FR",
    currentStatus: "processing",
    statusHistory: [
      {
        status: "pending",
        timestamp: "2023-11-19T14:25:00Z",
        comment: "Commande reçue"
      },
      {
        status: "processing",
        timestamp: "2023-11-20T09:30:00Z",
        comment: "Préparation en cours"
      }
    ],
    customer: {
      id: "cust_78965",
      firstName: "Pierre",
      lastName: "Leroy",
      email: "pierre.leroy@example.com",
      phone: "0723651489"
    },
    shippingMethod: "store_pickup",
    store: {
      id: "store_12",
      name: "FBE Store Bordeaux",
      address: {
        street: "45 Cours de l'Intendance",
        city: "Bordeaux",
        postalCode: "33000",
        country: "France"
      },
      phone: "0556789654",
      openingHours: "Lun-Sam: 10h-19h"
    },
    carrier: "N/A",
    estimatedDeliveryDate: "2023-11-22T00:00:00Z",
    items: [
      {
        id: "item_7",
        productId: "prod_3265",
        name: "PlayStation 5 Digital Edition",
        sku: "SONY-PS5-DIG",
        quantity: 1,
        unitPrice: 399.99,
        totalPrice: 399.99,
        imageUrl: "/images/products/ps5-digital.jpg"
      },
      {
        id: "item_8",
        productId: "prod_7845",
        name: "Manette DualSense",
        sku: "SONY-PS5-CTRL",
        quantity: 1,
        unitPrice: 69.99,
        totalPrice: 69.99,
        imageUrl: "/images/products/dualsense.jpg"
      },
      {
        id: "item_9",
        productId: "prod_1254",
        name: "Jeu Spider-Man 2 PS5",
        sku: "GAME-PS5-SM2",
        quantity: 1,
        unitPrice: 79.99,
        totalPrice: 79.99,
        imageUrl: "/images/products/spiderman2.jpg"
      }
    ],
    subtotal: 549.97,
    shippingCost: 0,
    totalAmount: 549.97,
    lastUpdated: "2023-11-20T09:30:00Z"
  }
]; 