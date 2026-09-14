/**
 * Mariage Aude et Jérémie – réception des souvenirs des invités.
 *
 * Déployé en "Application web", exécuté EN TANT QUE TOI, accessible à "Tout le monde".
 * Les invités n'ont accès à rien : ils ne font qu'écrire dans un dossier de ton Drive
 * qu'ils ne peuvent ni lister ni lire. Chaque envoi crée un sous-dossier "date – nom".
 */

const FOLDER_ID = '1dTlYCAjIVNyllkKX-3MeatGr5R5h6WuU';   // dossier racine "Mariage – souvenirs invités"
const SHEET_ID  = '1ueqeEvXyx6Uj5-9TjVJf3JvDqFPHEXmth7JHc-Ocj9I';       // Google Sheet "Journal des envois"

function doGet() { return out({ ok: true, service: 'souvenirs-mariage' }); }

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'JSON invalide' }); }
  try {
    switch (data.action) {
      case 'start':    return out(start(data));
      case 'init':     return out(initUpload(data));
      case 'finalize': return out(finalizeUpload(data));
      case 'message':  return out(saveMessage(data));
      default:         return out({ ok: false, error: 'action inconnue' });
    }
  } catch (err) {
    return out({ ok: false, error: String(err.message || err) });
  }
}

/* Crée le sous-dossier de l'envoi et renvoie son id (batchId). */
function start(d) {
  const nom = propre(d.nom, 80) || 'Invité anonyme';
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  const racine = DriveApp.getFolderById(FOLDER_ID);
  const dossier = racine.createFolder(date + ' – ' + nom);
  return { ok: true, batchId: dossier.getId() };
}

/* Ouvre une session d'upload "resumable" sur l'API Drive, au nom du propriétaire.
   Le navigateur de l'invité enverra ensuite les morceaux directement à Google. */
function initUpload(d) {
  if (!d.batchId || !d.name || !d.size) throw new Error('paramètres manquants');
  const size = Number(d.size);
  const meta = {
    name: propre(d.name, 200),
    parents: [d.batchId],
    description: [ 'Envoyé par : ' + propre(d.nom, 80), d.description ? 'Mot : ' + propre(d.description, 2000) : '' ].filter(Boolean).join('\n')
  };
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': d.mimeType || 'application/octet-stream',
      'X-Upload-Content-Length': String(size),
      Origin: d.origin || ''            // indispensable pour que le navigateur puisse envoyer les morceaux (CORS)
    },
    payload: JSON.stringify(meta),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Drive a refusé l\'ouverture de session (' + res.getResponseCode() + ')');
  const location = res.getHeaders()['Location'] || res.getHeaders()['location'];
  if (!location) throw new Error('pas d\'URL de session');
  return { ok: true, uploadUrl: location };
}

/* Consigne le fichier dans le journal. */
function finalizeUpload(d) {
  let lien = '';
  if (d.fileId) { try { lien = DriveApp.getFileById(d.fileId).getUrl(); } catch (e) { lien = '(id ' + d.fileId + ')'; } }
  journal([ new Date(), propre(d.nom, 80), 'Fichier', propre(d.name, 200), Math.round(Number(d.size) / 1048576 * 10) / 10 + ' Mo', propre(d.description, 2000), lien, d.batchId ]);
  return { ok: true };
}

/* Message global de l'invité (mot pour l'organisateur, musique, indication...). */
function saveMessage(d) {
  const nom = propre(d.nom, 80), msg = propre(d.message, 5000);
  const dossier = DriveApp.getFolderById(d.batchId);
  if (msg) dossier.createFile('Mot de ' + nom + '.txt', msg, MimeType.PLAIN_TEXT);
  if (!Number(d.nbFichiers) && !msg) { dossier.setTrashed(true); return { ok: true }; }   // envoi vide : on nettoie
  journal([ new Date(), nom, 'Mot pour l\'organisateur', '', Number(d.nbFichiers) + ' fichier(s)', msg, dossier.getUrl(), d.batchId ]);
  return { ok: true };
}

/* ---------- utilitaires ---------- */
function journal(ligne) {
  const feuille = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (feuille.getLastRow() === 0) feuille.appendRow(['Date', 'Invité', 'Type', 'Fichier', 'Taille / nb', 'Mot', 'Lien', 'Dossier']);
  feuille.appendRow(ligne);
}
function propre(s, max) { return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
