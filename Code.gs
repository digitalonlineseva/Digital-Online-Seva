/**
 * DIGITAL ONLINE SEVA - CLOUD ENGINE v2.5
 * Managed by: amitkumar8409350@gmail.com
 */

// 1. DATABASE CONFIGURATION
// If you want to use a specific sheet, paste its ID here. 
// Otherwise, it creates one named 'DOS_MASTER_DATABASE' automatically.
const MANUAL_SS_ID = ""; 

function doGet(e) {
  const action = e.parameter.action;
  const ss = getOrCreateDatabase();
  
  if (action === 'getApplications') {
    return jsonResponse(getSheetData(ss, 'Applications'));
  }

  if (action === 'getRetailers') {
    return jsonResponse(getSheetData(ss, 'Retailers'));
  }

  if (action === 'getServices') {
    return jsonResponse(getSheetData(ss, 'Services'));
  }

  return jsonResponse({status: 'online', version: '2.5', message: 'DOS Portal Backend Active'});
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  const data = postData.data;
  const ss = getOrCreateDatabase();

  try {
    if (action === 'saveApplication') {
      saveToSheet(ss, 'Applications', data);
    }

    if (action === 'updateStatus') {
      updateRow(ss, 'Applications', data.id, {
        status: data.status,
        remark: data.remark || "",
        processedDocumentUrl: data.fileUrl || "",
        processedDocumentName: data.fileName || ""
      });
    }

    if (action === 'saveRetailer') {
      saveToSheet(ss, 'Retailers', data);
    }

    if (action === 'updateRetailer') {
      updateRow(ss, 'Retailers', data.id, data);
    }

    if (action === 'saveService') {
      saveToSheet(ss, 'Services', data);
    }

    if (action === 'deleteService') {
      deleteRow(ss, 'Services', data.id);
    }

    return ContentService.createTextOutput("OK");
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.message);
  }
}

// --- HELPER FUNCTIONS ---

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      // Auto-parse JSON strings back to objects/arrays
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      // Handle boolean strings from sheet
      if (val === "true") val = true;
      if (val === "false") val = false;
      obj[header] = val;
    });
    return obj;
  });
}

function saveToSheet(ss, sheetName, data) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getDataRange().getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === data.id.toString()) { rowIndex = i + 1; break; }
  }
  
  const row = headers.map(h => {
    const val = data[h];
    // Serialize objects/arrays to JSON strings for the sheet
    return (val !== undefined && val !== null && typeof val === 'object') ? JSON.stringify(val) : (val !== undefined ? val : "");
  });
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function updateRow(ss, sheetName, id, updates) {
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id.toString()) {
      for (const key in updates) {
        const colIdx = headers.indexOf(key);
        if (colIdx > -1) {
          let val = updates[key];
          if (val && typeof val === 'object') val = JSON.stringify(val);
          sheet.getRange(i + 1, colIdx + 1).setValue(val);
        }
      }
      break;
    }
  }
}

function deleteRow(ss, sheetName, id) {
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateDatabase() {
  let ss;
  if (MANUAL_SS_ID) {
    ss = SpreadsheetApp.openById(MANUAL_SS_ID);
  } else {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty('db_id');
    if (!id) {
      ss = SpreadsheetApp.create('DOS_MASTER_DATABASE');
      id = ss.getId();
      props.setProperty('db_id', id);
    } else {
      try {
        ss = SpreadsheetApp.openById(id);
      } catch(e) {
        ss = SpreadsheetApp.create('DOS_MASTER_DATABASE');
        props.setProperty('db_id', ss.getId());
      }
    }
  }
  
  const setupSheet = (name, headers, color) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground(color).setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    return sheet;
  };

  // 1. Applications Sheet (For all submitted forms)
  setupSheet('Applications', ['id', 'serviceId', 'serviceName', 'fullName', 'motherName', 'dob', 'fatherName', 'mobileNumber', 'status', 'submittedAt', 'amountPaid', 'userId', 'addressInfo', 'landInfo', 'additionalNames', 'documentUrl', 'photoUrl', 'signatureUrl', 'processedDocumentUrl', 'processedDocumentName', 'remark', 'paymentMethod'], '#1e293b');
  
  // 2. Retailers Sheet (For registered agents/partners)
  setupSheet('Retailers', ['id', 'username', 'role', 'fullName', 'shopName', 'email', 'mobileNumber', 'aadharNumber', 'status', 'registeredAt', 'customPassword', 'walletBalance', 'transactions'], '#059669');
  
  // 3. Services Sheet (For configurable portal services)
  const serviceSheet = setupSheet('Services', ['id', 'title', 'description', 'icon', 'color', 'price', 'helpLink', 'requiresMotherName', 'requiresFatherName', 'requiresDob', 'requiresAddress', 'requiresLandDetails', 'requiresPhoto', 'requiresSignature', 'requiresEpic', 'allowAdditionalMembers'], '#2563eb');
  
  // SEED DEFAULT SERVICES if sheet is empty
  if (serviceSheet.getLastRow() === 1) {
    const defaultServices = [
      ['ration', 'Ration Card', 'Apply for new ration card or updates.', 'fa-solid fa-wheat-awn', 'bg-emerald-500', 150, '#', true, true, false, true, false, true, true, false, true],
      ['pan', 'PAN Card', 'Fresh application or corrections.', 'fa-solid fa-address-card', 'bg-blue-600', 150, '#', false, true, true, false, false, true, true, false, false],
      ['aadhar', 'Aadhaar Service', 'Updates, Link Mobile, or PVC Order.', 'fa-solid fa-id-badge', 'bg-red-500', 100, '#', true, true, true, true, false, true, false, false, false],
      ['voter', 'Voter ID', 'New registration or transfer.', 'fa-solid fa-id-card-clip', 'bg-indigo-600', 50, '#', false, true, false, true, false, true, true, true, false],
      ['income', 'Income Certificate', 'Certification of annual income.', 'fa-solid fa-money-bill-trend-up', 'bg-blue-500', 10, '#', true, true, false, true, false, true, true, false, false],
      ['doc-filing', 'Document Filing', 'Professional filing for various legal docs.', 'fa-solid fa-folder-open', 'bg-slate-700', 250, '#', false, false, false, true, false, true, true, false, false]
    ];
    serviceSheet.getRange(2, 1, defaultServices.length, defaultServices[0].length).setValues(defaultServices);
  }

  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) ss.deleteSheet(sheet1);
  
  return ss;
}