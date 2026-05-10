import jsPDF from 'jspdf';
import { Mission, Settings } from '../types';

export const generateRapportExpertise = (mission: Mission, settings: Settings) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Couleurs
  const primaryColor = '#1a2940';
  const accentColor = '#ff6b2c';

  // En-tête
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT D\'EXPERTISE', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mission n° ${mission.id.slice(0,8).toUpperCase()} - ${new Date(mission.dateTime).toLocaleDateString('fr-FR')}`, 105, 30, { align: 'center' });
  const typesStr = mission.prestations && mission.prestations.length > 0 ? mission.prestations.map((p: any) => p.type).join(' + ') : mission.type;
  doc.text(`Type : ${typesStr.toUpperCase()}`, 105, 36, { align: 'center' });

  // Infos Véhicule
  doc.setTextColor('#000000');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS VÉHICULE', 15, 55);
  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.5);
  doc.line(15, 57, 195, 57);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Immatriculation : ${mission.plaque}`, 15, 65);
  doc.text(`Kilométrage : ${mission.kilometrage ? mission.kilometrage.toLocaleString() + ' km' : 'Non renseigné'}`, 105, 65);
  doc.text(`Couleur : ${mission.couleur || 'Non renseigné'}`, 15, 72);
  doc.text(`État général : ${mission.etatGeneral ? mission.etatGeneral.toUpperCase() : 'Non renseigné'}`, 105, 72);

  // Dégâts constatés
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉGÂTS CONSTATÉS', 15, 85);
  doc.line(15, 87, 195, 87);

  let yOffset = 95;
  if (mission.degats.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun dégât constaté sur le véhicule.', 15, yOffset);
    yOffset += 10;
  } else {
    doc.setFontSize(10);
    mission.degats.forEach((degat, index) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${degat.piece} (${degat.type.toUpperCase()})`, 15, yOffset);
      doc.setFont('helvetica', 'normal');
      if (degat.commentaire) {
        doc.text(`Note: ${degat.commentaire}`, 20, yOffset + 5);
        yOffset += 12;
      } else {
        yOffset += 8;
      }
    });
  }

  // Notes
  if (mission.notesTexte) {
    yOffset += 5;
    if (yOffset > 260) { doc.addPage(); yOffset = 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVATIONS / NOTES', 15, yOffset);
    doc.line(15, yOffset + 2, 195, yOffset + 2);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(mission.notesTexte, 180);
    doc.text(splitNotes, 15, yOffset + 10);
    yOffset += 10 + (splitNotes.length * 5);
  }

  // Signature
  if (mission.signature) {
    if (yOffset > 220) { doc.addPage(); yOffset = 20; }
    yOffset += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURE DU CLIENT', 15, yOffset);
    doc.setDrawColor('#000000');
    doc.setLineWidth(0.2);
    doc.rect(15, yOffset + 5, 80, 40);
    doc.addImage(mission.signature, 'PNG', 15, yOffset + 5, 80, 40);
  }

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#888888');
    doc.text(`${settings.companyName} - Rapport d'Expertise AutoMission Pro - Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`Rapport_Expertise_${mission.plaque}_${mission.id.slice(0,5)}.pdf`);
};

export const generateFacture = (mission: Mission, settings: Settings, clientId: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const clientPrestations = (mission.prestations || []).filter(p => p.clientId === clientId);
  if (clientPrestations.length === 0) return;
  
  const clientName = clientPrestations[0].clientName || 'Client Inconnu';
  const prixTTC = clientPrestations.reduce((sum, p) => sum + p.prixTTC, 0);

  const primaryColor = '#1a2940';

  // En-tête Prestataire
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName.toUpperCase(), 15, 25);
  
  // Info Facture (Droite)
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'normal');
  doc.text('FACTURE', 150, 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° FAC-${new Date().getFullYear()}-${mission.id.slice(0,5).toUpperCase()}`, 150, 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 150, 30);

  // Client Box
  doc.setDrawColor(primaryColor);
  doc.setFillColor('#f8f9fa');
  doc.rect(100, 40, 95, 35, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('Facturé à :', 105, 48);
  doc.setFontSize(12);
  doc.text(clientName, 105, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Client Compte Pro', 105, 62);

  // Détails véhicule
  doc.text(`Véhicule : ${mission.plaque}`, 15, 80);
  if (mission.kilometrage) doc.text(`Kilométrage : ${mission.kilometrage} km`, 15, 86);

  // Détails prestation
  doc.setFont('helvetica', 'bold');
  doc.text('DÉSIGNATION', 15, 95);
  doc.text('MONTANT HT', 160, 95, { align: 'right' });
  doc.line(15, 98, 195, 98);

  doc.setFont('helvetica', 'normal');
  
  let yOffset = 108;
  const tvaRate = settings.tva / 100;
  
  clientPrestations.forEach((p, index) => {
    const pHT = p.prixTTC / (1 + tvaRate);
    doc.text(`Prestation : ${p.type}`, 15, yOffset);
    doc.text(`${pHT.toFixed(2)} €`, 160, yOffset, { align: 'right' });
    yOffset += 8;
  });

  // Calculs TVA
  const prixHT = prixTTC / (1 + tvaRate);
  const montantTVA = prixTTC - prixHT;

  // Totaux Box
  doc.setDrawColor('#cccccc');
  doc.line(100, yOffset + 10, 195, yOffset + 10);
  doc.text('Total HT', 130, yOffset + 20);
  doc.text(`${prixHT.toFixed(2)} €`, 190, yOffset + 20, { align: 'right' });
  
  doc.text(`TVA (${settings.tva}%)`, 130, yOffset + 28);
  doc.text(`${montantTVA.toFixed(2)} €`, 190, yOffset + 28, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL TTC', 130, yOffset + 40);
  doc.text(`${prixTTC.toFixed(2)} €`, 190, yOffset + 40, { align: 'right' });

  // Mentions légales
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#666666');
  doc.text('Conditions de paiement : À réception de facture.', 15, 270);
  doc.text(`En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.`, 15, 274);
  doc.text(`Indemnité forfaitaire pour frais de recouvrement : 40 €`, 15, 278);

  doc.save(`Facture_${clientName.replace(/\s+/g, '_')}_${mission.plaque}.pdf`);
};
