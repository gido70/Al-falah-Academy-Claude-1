/**
 * ═══════════════════════════════════════════════════════════
 *  ALFALAH PLATFORM — Google Apps Script Backend
 *  ارفع هذا الملف في Google Apps Script وانشره كـ Web App
 * ═══════════════════════════════════════════════════════════
 *
 *  خطوات النشر:
 *  1. افتح script.google.com
 *  2. مشروع جديد → الصق هذا الكود
 *  3. Deploy → New deployment → Web app
 *  4. Execute as: Me | Who has access: Anyone
 *  5. انسخ الرابط وضعه في sheets-config.js
 * ═══════════════════════════════════════════════════════════
 */

// ── معرف جدول Google Sheets ──────────────────────────────
// ضع هنا الـ ID من رابط الجدول:
// https://docs.google.com/spreadsheets/d/[ID_HERE]/edit
var SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE';

// ── أسماء الأوراق ─────────────────────────────────────────
var SHEETS = {
  evaluations: 'التقييمات',
  schedule:    'جدول الدوام',
  visits:      'الزيارات',
  reports:     'التقارير',
  files:       'الملفات'
};

// ═══════════════════════════════════════════════════════════
//  الاستجابة لطلبات GET (جلب البيانات)
// ═══════════════════════════════════════════════════════════
function doGet(e) {
  var params = e.parameter;
  var action = params.action || '';
  var result;

  try {
    switch(action) {
      case 'getEvaluation':
        result = getEvaluation(params.school);
        break;
      case 'getAllEvaluations':
        result = getAllEvaluations();
        break;
      case 'getWeeks':
        result = getAllWeeks();
        break;
      case 'getWeek':
        result = getWeek(parseInt(params.week));
        break;
      case 'getFiles':
        result = getFiles(params.school, params.category);
        break;
      case 'ping':
        result = { ok: true, time: new Date().toLocaleString('ar-AE') };
        break;
      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { ok: false, error: err.toString() };
  }

  return _json(result);
}

// ═══════════════════════════════════════════════════════════
//  الاستجابة لطلبات POST (حفظ البيانات)
// ═══════════════════════════════════════════════════════════
function doPost(e) {
  var body, result;

  try {
    body = JSON.parse(e.postData.contents);
    var action = body.action || '';

    switch(action) {
      case 'saveEvaluation':
        result = saveEvaluation(body.school, body.data);
        break;
      case 'saveWeek':
        result = saveWeek(body.week, body.data);
        break;
      case 'saveVisit':
        result = saveVisit(body.data);
        break;
      case 'saveReport':
        result = saveReport(body.data);
        break;
      case 'saveFile':
        result = saveFile(body.school, body.category, body.filename, body.url, body.notes);
        break;
      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { ok: false, error: err.toString() };
  }

  return _json(result);
}

// ═══════════════════════════════════════════════════════════
//  التقييمات
// ═══════════════════════════════════════════════════════════
function saveEvaluation(schoolCode, data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = _getOrCreateSheet(ss, SHEETS.evaluations, [
    'الوقت','رمز المدرسة','اسم المدرسة','المدينة',
    'تاريخ الزيارة','اسم الأخصائي','المجموع',
    'المجموعات','البيئة','التقنية','الكادر','الخدمات',
    'التصنيف','نقاط القوة','نقاط الضعف','التوصيات','البيانات الكاملة'
  ]);

  var scores = data.scores || {};
  var fields = data.fields || {};

  // ابحث عن سجل موجود لنفس المدرسة لتحديثه
  var rows = sh.getDataRange().getValues();
  var updateRow = -1;
  for(var i = 1; i < rows.length; i++) {
    if(rows[i][1] === schoolCode) { updateRow = i + 1; break; }
  }

  var row = [
    new Date().toLocaleString('ar-AE'),
    schoolCode,
    data.schoolName || '',
    data.schoolCity || '',
    fields.date || '',
    fields.lib || '',
    data.totalScore || 0,
    scores.col || 0,
    scores.env || 0,
    scores.tech || 0,
    scores.staff || 0,
    scores.svc || 0,
    _gradeLabel(data.totalScore),
    fields.ovStr || '',
    fields.ovGap || '',
    fields.ovRec || '',
    JSON.stringify(data)
  ];

  if(updateRow > 0) {
    sh.getRange(updateRow, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }

  _applySheetStyle(sh);
  return { ok: true, action: updateRow > 0 ? 'updated' : 'inserted' };
}

function getEvaluation(schoolCode) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEETS.evaluations);
  if(!sh) return { ok: false, data: null };

  var rows = sh.getDataRange().getValues();
  for(var i = 1; i < rows.length; i++) {
    if(rows[i][1] === schoolCode) {
      try {
        return { ok: true, data: JSON.parse(rows[i][16]) };
      } catch(e) {
        return { ok: false, data: null };
      }
    }
  }
  return { ok: false, data: null };
}

function getAllEvaluations() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEETS.evaluations);
  if(!sh) return { ok: true, data: [] };

  var rows = sh.getDataRange().getValues();
  var result = [];
  for(var i = 1; i < rows.length; i++) {
    if(!rows[i][1]) continue;
    result.push({
      code:  rows[i][1],
      name:  rows[i][2],
      city:  rows[i][3],
      date:  rows[i][4],
      score: rows[i][6],
      grade: rows[i][12]
    });
  }
  return { ok: true, data: result };
}

// ═══════════════════════════════════════════════════════════
//  جدول الدوام
// ═══════════════════════════════════════════════════════════
function saveWeek(weekNum, data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = _getOrCreateSheet(ss, SHEETS.schedule, [
    'الوقت','رقم الأسبوع','من تاريخ','إلى تاريخ',
    'حالة الأسبوع','إجمالي ساعات الحضور','عدد الزيارات',
    'ملخص المهام','ملاحظات','البيانات الكاملة'
  ]);

  // ابحث عن أسبوع موجود
  var rows = sh.getDataRange().getValues();
  var updateRow = -1;
  for(var i = 1; i < rows.length; i++) {
    if(parseInt(rows[i][1]) === parseInt(weekNum)) { updateRow = i + 1; break; }
  }

  var row = [
    new Date().toLocaleString('ar-AE'),
    weekNum,
    data.wstart || '',
    data.wend   || '',
    data.wstatus || 'دوام كامل',
    data.totalHours || '',
    data.visitCount || 0,
    data.weekSummary || '',
    data.weekNotes || '',
    JSON.stringify(data)
  ];

  if(updateRow > 0) {
    sh.getRange(updateRow, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }

  _applySheetStyle(sh);
  return { ok: true, week: weekNum };
}

function getWeek(weekNum) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEETS.schedule);
  if(!sh) return { ok: false, data: null };

  var rows = sh.getDataRange().getValues();
  for(var i = 1; i < rows.length; i++) {
    if(parseInt(rows[i][1]) === weekNum) {
      try {
        return { ok: true, data: JSON.parse(rows[i][9]) };
      } catch(e) { return { ok: false }; }
    }
  }
  return { ok: false, data: null };
}

function getAllWeeks() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEETS.schedule);
  if(!sh) return { ok: true, data: [] };

  var rows = sh.getDataRange().getValues();
  var result = [];
  for(var i = 1; i < rows.length; i++) {
    if(!rows[i][1]) continue;
    result.push({
      week:   rows[i][1],
      start:  rows[i][2],
      end:    rows[i][3],
      status: rows[i][4],
      hours:  rows[i][5]
    });
  }
  result.sort(function(a,b){ return a.week - b.week; });
  return { ok: true, data: result };
}

// ═══════════════════════════════════════════════════════════
//  الملفات (روابط Google Drive)
// ═══════════════════════════════════════════════════════════
function saveFile(schoolCode, category, filename, driveUrl, notes) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = _getOrCreateSheet(ss, SHEETS.files, [
    'الوقت','رمز المدرسة','النوع','اسم الملف','رابط Drive','ملاحظات'
  ]);
  sh.appendRow([
    new Date().toLocaleString('ar-AE'),
    schoolCode, category, filename, driveUrl || '', notes || ''
  ]);
  _applySheetStyle(sh);
  return { ok: true };
}

function getFiles(schoolCode, category) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEETS.files);
  if(!sh) return { ok: true, data: [] };

  var rows = sh.getDataRange().getValues();
  var result = [];
  for(var i = 1; i < rows.length; i++) {
    if(rows[i][1] !== schoolCode) continue;
    if(category && rows[i][2] !== category) continue;
    result.push({ time: rows[i][0], category: rows[i][2], name: rows[i][3], url: rows[i][4], notes: rows[i][5] });
  }
  return { ok: true, data: result };
}

// ═══════════════════════════════════════════════════════════
//  التقارير
// ═══════════════════════════════════════════════════════════
function saveReport(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = _getOrCreateSheet(ss, SHEETS.reports, [
    'الوقت','الأسبوع','ملخص','الإنجازات','التحديات','الخطوة القادمة'
  ]);
  sh.appendRow([
    new Date().toLocaleString('ar-AE'),
    data.week || '',
    data.summary || '',
    data.achievements || '',
    data.challenges || '',
    data.nextSteps || ''
  ]);
  _applySheetStyle(sh);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════
//  أدوات مساعدة
// ═══════════════════════════════════════════════════════════
function _getOrCreateSheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if(!sh) {
    sh = ss.insertSheet(name);
    var hRange = sh.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setBackground('#0c447c');
    hRange.setFontColor('#ffffff');
    hRange.setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function _applySheetStyle(sh) {
  try {
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if(lastRow > 1) {
      sh.getRange(2, 1, lastRow - 1, lastCol).applyRowBanding(
        SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false
      );
    }
    sh.autoResizeColumns(1, lastCol);
  } catch(e) {}
}

function _gradeLabel(score) {
  if(!score) return '—';
  if(score >= 90) return 'ممتاز';
  if(score >= 80) return 'جيد جداً';
  if(score >= 70) return 'جيد';
  if(score >= 60) return 'مقبول';
  return 'يحتاج تطوير';
}

function _json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
