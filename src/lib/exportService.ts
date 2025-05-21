import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

export interface ExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  author?: string;
  dateFormat?: string;
  includeTimestamp?: boolean;
}

/**
 * Exporte des données vers un fichier CSV
 * @param data Données à exporter (tableau d'objets)
 * @param options Options d'exportation
 */
export const exportToCsv = <T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void => {
  try {
    // Générer le nom de fichier avec l'extension
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const fileName = `${options.fileName}${timestamp}.csv`;
    
    // Convertir les données en format CSV
    const header = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => 
      Object.values(item)
        .map(value => {
          // Échapper les virgules et guillemets
          if (typeof value === 'string') {
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
          }
          return value;
        })
        .join(',')
    );
    
    const csvContent = [header, ...rows].join('\n');
    
    // Créer un Blob et déclencher le téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erreur lors de l\'exportation au format CSV:', error);
    throw new Error('L\'exportation au format CSV a échoué');
  }
};

/**
 * Exporte des données vers un fichier Excel
 * @param data Données à exporter (tableau d'objets)
 * @param options Options d'exportation
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void => {
  try {
    // Générer le nom de fichier avec l'extension
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const fileName = `${options.fileName}${timestamp}.xlsx`;
    
    // Créer une feuille de calcul
    const worksheet = utils.json_to_sheet(data);
    
    // Créer un classeur et y ajouter la feuille
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Feuille1');
    
    // Définir les propriétés du document
    workbook.Props = {
      Title: options.title || options.fileName,
      Author: options.author || 'FFOV Application',
      CreatedDate: new Date()
    };
    
    // Générer le fichier Excel et déclencher le téléchargement
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erreur lors de l\'exportation au format Excel:', error);
    throw new Error('L\'exportation au format Excel a échoué');
  }
};

/**
 * Exporte des données vers un fichier PDF
 * @param data Données à exporter (tableau d'objets)
 * @param columns Définition des colonnes (nom, titre)
 * @param options Options d'exportation
 */
export const exportToPdf = <T extends Record<string, any>>(
  data: T[],
  columns: { key: string; header: string }[],
  options: ExportOptions
): void => {
  try {
    // Générer le nom de fichier avec l'extension
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const fileName = `${options.fileName}${timestamp}.pdf`;
    
    // Initialiser le document PDF (format A4)
    const doc = new jsPDF();
    
    // Ajouter un titre
    const title = options.title || options.fileName;
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Ajouter la date et l'auteur
    doc.setFontSize(11);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    if (options.author) {
      doc.text(`Par: ${options.author}`, 14, 36);
    }
    
    // Formater les données pour le tableau
    const headers = columns.map(col => col.header);
    const rows = data.map(item => 
      columns.map(col => item[col.key]?.toString() || '')
    );
    
    // Ajouter le tableau
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: options.author ? 40 : 34,
      headStyles: {
        fillColor: [46, 124, 186],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      margin: { top: 50 }
    });
    
    // Générer le PDF et déclencher le téléchargement
    doc.save(fileName);
  } catch (error) {
    console.error('Erreur lors de l\'exportation au format PDF:', error);
    throw new Error('L\'exportation au format PDF a échoué');
  }
};

/**
 * Exporte des données en format JSON
 * @param data Données à exporter 
 * @param options Options d'exportation
 */
export const exportToJson = <T>(
  data: T,
  options: ExportOptions
): void => {
  try {
    // Générer le nom de fichier avec l'extension
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    const fileName = `${options.fileName}${timestamp}.json`;
    
    // Convertir les données en chaîne JSON
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Créer un Blob et déclencher le téléchargement
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Erreur lors de l\'exportation au format JSON:', error);
    throw new Error('L\'exportation au format JSON a échoué');
  }
};

/**
 * Crée un composant de bouton d'exportation avec menu déroulant
 * @param targetId ID de l'élément cible pour le menu déroulant
 * @param data Données à exporter
 * @param options Options d'exportation
 * @param columns Définition des colonnes pour PDF (optionnel)
 */
export const ExportButton = (
  targetId: string,
  data: any[],
  options: ExportOptions,
  columns?: { key: string; header: string }[]
) => {
  // Fonction pour créer un menu d'exportation avec dropdown
  // À implémenter comme composant React
};
