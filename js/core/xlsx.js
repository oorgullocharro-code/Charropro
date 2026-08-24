const XML_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function createXlsxBlob(workbook) {
  const files = buildWorkbookFiles(workbook);
  const bytes = zipStore(files);
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function buildWorkbookFiles(workbook) {
  let imageSequence = 0;
  const sheets = workbook.sheets.map((sheet, index) => {
    const id = index + 1;
    const images = (sheet.images || []).map((image, imageIndex) => {
      imageSequence += 1;
      const extension = normalizeImageExtension(image.extension || image.mimeType);
      const fileStem = safeMediaName(image.name || `image-${imageSequence}`);
      return {
        ...image,
        id: imageIndex + 1,
        relationshipId: `rId${imageIndex + 1}`,
        mediaFile: `xl/media/${fileStem}-sheet${id}-${imageSequence}.${extension}`,
        extension
      };
    });
    return {
      ...sheet,
      id,
      images,
      file: `xl/worksheets/sheet${id}.xml`,
      drawingFile: images.length ? `xl/drawings/drawing${id}.xml` : ""
    };
  });

  const files = [
    {
      path: "[Content_Types].xml",
      content: buildContentTypes(sheets)
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
    },
    {
      path: "docProps/core.xml",
      content: buildCoreProps(workbook.generatedAt)
    },
    {
      path: "docProps/app.xml",
      content: buildAppProps(sheets)
    },
    {
      path: "xl/workbook.xml",
      content: buildWorkbookXml(sheets)
    },
    {
      path: "xl/_rels/workbook.xml.rels",
      content: buildWorkbookRels(sheets)
    },
    {
      path: "xl/styles.xml",
      content: buildStyles()
    },
    ...sheets.flatMap((sheet) => buildSheetFiles(sheet))
  ];

  return files;
}

function buildContentTypes(sheets) {
  const hasPng = sheets.some((sheet) => sheet.images.some((image) => image.extension === "png"));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${hasPng ? '<Default Extension="png" ContentType="image/png"/>' : ""}
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheets.map((sheet) => `<Override PartName="/${sheet.file}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n  ")}
  ${sheets.filter((sheet) => sheet.drawingFile).map((sheet) => `<Override PartName="/${sheet.drawingFile}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join("\n  ")}
</Types>`;
}

function buildCoreProps(generatedAt) {
  const now = normalizeIso(generatedAt) || new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>CharroPro</dc:creator>
  <cp:lastModifiedBy>CharroPro</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppProps(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>CharroPro</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="${sheets.length}" baseType="lpstr">
      ${sheets.map((sheet) => `<vt:lpstr>${xml(sheet.name)}</vt:lpstr>`).join("")}
    </vt:vector>
  </TitlesOfParts>
</Properties>`;
}

function buildWorkbookXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${XML_NS}" xmlns:r="${REL_NS}">
  <workbookPr date1904="false"/>
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="16000"/></bookViews>
  <sheets>
    ${sheets.map((sheet) => `<sheet name="${attr(sheet.name)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`).join("\n    ")}
  </sheets>
</workbook>`;
}

function buildWorkbookRels(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((sheet) => `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`).join("\n  ")}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function buildStyles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${XML_NS}">
  <fonts count="14">
    <font><sz val="7.5"/><name val="Arial"/></font>
    <font><b/><sz val="15"/><color rgb="FF08752A"/><name val="Arial"/></font>
    <font><b/><sz val="9"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="8"/><color rgb="FFE31B23"/><name val="Arial"/></font>
    <font><b/><sz val="7.5"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><sz val="7"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="6.5"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="10"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="8"/><color rgb="FF08752A"/><name val="Arial"/></font>
    <font><b/><sz val="11"/><color rgb="FFE31B23"/><name val="Arial"/></font>
    <font><b/><sz val="12"/><color rgb="FF000000"/><name val="Arial"/></font>
    <font><b/><sz val="5.5"/><color rgb="FFE31B23"/><name val="Arial"/></font>
    <font><b/><sz val="6.5"/><color rgb="FFE31B23"/><name val="Arial"/></font>
    <font><b/><sz val="5.5"/><color rgb="FF000000"/><name val="Arial"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE7E6E6"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFBFBFBF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="5">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF000000"/></left>
      <right style="thin"><color rgb="FF000000"/></right>
      <top style="thin"><color rgb="FF000000"/></top>
      <bottom style="thin"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="medium"><color rgb="FF000000"/></left>
      <right style="medium"><color rgb="FF000000"/></right>
      <top style="medium"><color rgb="FF000000"/></top>
      <bottom style="medium"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/><top/>
      <bottom style="medium"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="dotted"><color rgb="FF000000"/></left>
      <right style="dotted"><color rgb="FF000000"/></right>
      <top style="dotted"><color rgb="FF000000"/></top>
      <bottom style="dotted"><color rgb="FF000000"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="25">
    <xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="12" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="2" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="5" fillId="2" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="bottom"/></xf>
    <xf numFmtId="0" fontId="0" fillId="2" borderId="3" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="bottom"/></xf>
    <xf numFmtId="0" fontId="6" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="10" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="10" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="11" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="6" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" shrinkToFit="1"/></xf>
    <xf numFmtId="0" fontId="13" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1" shrinkToFit="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function buildWorksheet(sheet) {
  const rows = sheet.rows || [];
  const maxCols = Math.max(12, ...rows.map((row) => row.length), ...(sheet.widths || []).map((_, index) => index + 1));
  const lastRef = `${colName(maxCols)}${Math.max(rows.length, 1)}`;
  const merges = sheet.merges || [`A1:${colName(Math.min(maxCols, 14))}1`];
  const freezeRows = Math.max(0, Math.floor(finiteNumber(sheet.freezeRows, 5)));
  const margins = sheet.margins || {};
  const pageSetup = buildPageSetup(sheet);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${XML_NS}" xmlns:r="${REL_NS}">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <dimension ref="A1:${lastRef}"/>
  <sheetViews>
    <sheetView workbookViewId="0" showGridLines="${sheet.showGridLines === false ? 0 : 1}">
      ${freezeRows ? `<pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/>` : ""}
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${buildColumns(maxCols, sheet.widths)}
  <sheetData>
    ${rows.map((row, index) => buildRow(row, index + 1, getRowStyle(row, index), sheet.rowHeights?.[index])).join("\n    ")}
  </sheetData>
  <mergeCells count="${merges.length}">
    ${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("\n    ")}
  </mergeCells>
  <printOptions horizontalCentered="${sheet.horizontalCentered ? 1 : 0}" verticalCentered="0"/>
  <pageMargins left="${finiteNumber(margins.left, 0.25)}" right="${finiteNumber(margins.right, 0.25)}" top="${finiteNumber(margins.top, 0.5)}" bottom="${finiteNumber(margins.bottom, 0.5)}" header="${finiteNumber(margins.header, 0.3)}" footer="${finiteNumber(margins.footer, 0.3)}"/>
  ${pageSetup}
  ${sheet.drawingFile ? '<drawing r:id="rId1"/>' : ""}
</worksheet>`;
}

function buildPageSetup(sheet) {
  const dimensions = sheet.paperWidth && sheet.paperHeight
    ? ` paperWidth="${attr(sheet.paperWidth)}" paperHeight="${attr(sheet.paperHeight)}"`
    : ` paperSize="${Math.max(1, Math.floor(finiteNumber(sheet.paperSize, 5)))}"`;
  return `<pageSetup orientation="${attr(sheet.orientation || "landscape")}"${dimensions} fitToWidth="${Math.max(1, Math.floor(finiteNumber(sheet.fitToWidth, 1)))}" fitToHeight="${Math.max(1, Math.floor(finiteNumber(sheet.fitToHeight, 1)))}"/>`;
}

function buildSheetFiles(sheet) {
  const files = [{ path: sheet.file, content: buildWorksheet(sheet) }];
  if (!sheet.images.length) return files;
  files.push({
    path: `xl/worksheets/_rels/sheet${sheet.id}.xml.rels`,
    content: buildWorksheetRelationships(sheet)
  });
  files.push({ path: sheet.drawingFile, content: buildDrawing(sheet) });
  files.push({
    path: `xl/drawings/_rels/drawing${sheet.id}.xml.rels`,
    content: buildDrawingRelationships(sheet)
  });
  for (const image of sheet.images) {
    files.push({ path: image.mediaFile, content: decodeBase64(image.base64) });
  }
  return files;
}

function buildWorksheetRelationships(sheet) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${sheet.id}.xml"/>
</Relationships>`;
}

function buildDrawing(sheet) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${REL_NS}">
  ${sheet.images.map((image) => buildImageAnchor(image)).join("\n  ")}
</xdr:wsDr>`;
}

function buildImageAnchor(image) {
  const width = Math.max(1, finiteNumber(image.width, 96));
  const height = Math.max(1, finiteNumber(image.height, 96));
  const col = Math.max(0, Math.floor(finiteNumber(image.col, 0)));
  const row = Math.max(0, Math.floor(finiteNumber(image.row, 0)));
  const colOffset = Math.max(0, finiteNumber(image.colOffset, 0));
  const rowOffset = Math.max(0, finiteNumber(image.rowOffset, 0));
  const cx = Math.round(width * 9525);
  const cy = Math.round(height * 9525);
  return `<xdr:oneCellAnchor>
    <xdr:from><xdr:col>${col}</xdr:col><xdr:colOff>${Math.round(colOffset * 9525)}</xdr:colOff><xdr:row>${row}</xdr:row><xdr:rowOff>${Math.round(rowOffset * 9525)}</xdr:rowOff></xdr:from>
    <xdr:ext cx="${cx}" cy="${cy}"/>
    <xdr:pic>
      <xdr:nvPicPr><xdr:cNvPr id="${image.id}" name="${attr(image.name || `Image ${image.id}`)}"/><xdr:cNvPicPr/></xdr:nvPicPr>
      <xdr:blipFill><a:blip r:embed="${image.relationshipId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
      <xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
    </xdr:pic>
    <xdr:clientData/>
  </xdr:oneCellAnchor>`;
}

function buildDrawingRelationships(sheet) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheet.images.map((image) => `<Relationship Id="${image.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${image.mediaFile.split("/").pop()}"/>`).join("\n  ")}
</Relationships>`;
}

function buildColumns(maxCols, customWidths = []) {
  const widths = customWidths.length
    ? customWidths
    : [24, 18, 18, 18, 18, 18, 16, 16, 16, 22, 24, 28, 20, 20, 20, 20];
  const cols = [];
  for (let index = 1; index <= maxCols; index += 1) {
    cols.push(`<col min="${index}" max="${index}" width="${widths[index - 1] || 16}" customWidth="1"/>`);
  }
  return `<cols>${cols.join("")}</cols>`;
}

function buildRow(row, rowNumber, styleIndex, customHeight) {
  const height = customHeight || (rowNumber === 1 ? 24 : 21);
  return `<row r="${rowNumber}" ht="${height}" customHeight="1">${row.map((value, index) => buildCell(value, rowNumber, index + 1, styleIndex)).join("")}</row>`;
}

function buildCell(value, rowNumber, colNumber, styleIndex) {
  const cellValue = getCellValue(value);
  const cellStyle = getCellStyle(value, styleIndex);

  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return `<c r="${colName(colNumber)}${rowNumber}" s="${cellStyle}"/>`;
  }

  if (typeof cellValue === "number" && Number.isFinite(cellValue)) {
    return `<c r="${colName(colNumber)}${rowNumber}" s="${cellStyle === styleIndex ? 6 : cellStyle}"><v>${cellValue}</v></c>`;
  }

  return `<c r="${colName(colNumber)}${rowNumber}" t="inlineStr" s="${cellStyle}"><is><t>${xml(String(cellValue))}</t></is></c>`;
}

function getCellValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) return value.value;
  return value;
}

function getCellStyle(value, fallback) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("style" in value)) return fallback;
  if (typeof value.style === "number") return value.style;
  return STYLE_INDEX[value.style] ?? fallback;
}

const STYLE_INDEX = {
  plain: 0,
  normal: 1,
  grid: 1,
  sectionTitle: 2,
  section: 2,
  groupHeader: 3,
  compactGroupHeader: 23,
  compactColumnHeader: 24,
  header: 4,
  columnHeader: 4,
  badHeader: 5,
  scoreCell: 6,
  badScoreCell: 7,
  badCodeCell: 22,
  totalCell: 8,
  participant: 9,
  substitute: 10,
  documentControl: 11,
  institutionTitle: 12,
  plainLabel: 13,
  headerValue: 14,
  controlBox: 15,
  signatureLabel: 16,
  signatureLine: 17,
  footer: 18,
  footerRed: 19,
  finalLabel: 20,
  finalScore: 21,
  title: 12,
  red: 5,
  total: 8,
  subheader: 3,
  number: 6,
  redHeader: 5,
  verticalSection: 2,
  whiteHeader: 4,
  signature: 17,
  greenTitle: 12,
  highlight: 21
};

function getRowStyle(row, index) {
  const first = String(getCellValue(row[0]) || "");
  const sectionNames = new Set([
    "CALA DE CABALLO",
    "PIALES EN EL LIENZO",
    "COLEADERO",
    "JINETEO DE TORO",
    "TERNA EN EL RUEDO",
    "JINETEO DE YEGUA",
    "MANGANAS A PIE",
    "MANGANAS A CABALLO",
    "PASO DE LA MUERTE"
  ]);

  if (index === 0) return 1;
  if (sectionNames.has(first)) return 3;
  if (first.includes("TOTAL") || first.includes("PUNTUACION")) return 4;
  if (row.some((cell) => String(getCellValue(cell) || "").match(/BASE|BUENO|MALO|TOTAL|DETALLE|OPORTUNIDAD/))) return 2;
  return 0;
}

function colName(colNumber) {
  let name = "";
  let current = colNumber;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const entries = files.map((file) => ({
    name: encoder.encode(file.path),
    data: file.content instanceof Uint8Array ? file.content : encoder.encode(file.content),
    path: file.path
  }));

  const parts = [];
  const centralParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const crc = crc32(entry.data);
    const local = localFileHeader(entry, crc);
    parts.push(local, entry.name, entry.data);

    const central = centralDirectoryHeader(entry, crc, offset);
    centralParts.push(central, entry.name);
    offset += local.length + entry.name.length + entry.data.length;
  });

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = endCentralDirectory(entries.length, centralSize, centralOffset);
  return concatUint8([...parts, ...centralParts, end]);
}

function decodeBase64(value) {
  const raw = atob(String(value || "").replace(/^data:[^,]+,/, ""));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function normalizeImageExtension(value) {
  const normalized = String(value || "png").toLowerCase().replace(/^image\//, "").replace(/[^a-z0-9]/g, "");
  return normalized === "png" ? normalized : "png";
}

function safeMediaName(value) {
  return String(value || "image").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/(^-|-$)/g, "") || "image";
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeIso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function localFileHeader(entry, crc) {
  const view = new DataView(new ArrayBuffer(30));
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, entry.data.length, true);
  view.setUint32(22, entry.data.length, true);
  view.setUint16(26, entry.name.length, true);
  view.setUint16(28, 0, true);
  return new Uint8Array(view.buffer);
}

function centralDirectoryHeader(entry, crc, offset) {
  const view = new DataView(new ArrayBuffer(46));
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, entry.data.length, true);
  view.setUint32(24, entry.data.length, true);
  view.setUint16(28, entry.name.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  return new Uint8Array(view.buffer);
}

function endCentralDirectory(entriesCount, centralSize, centralOffset) {
  const view = new DataView(new ArrayBuffer(22));
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entriesCount, true);
  view.setUint16(10, entriesCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return new Uint8Array(view.buffer);
}

function concatUint8(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function attr(value) {
  return xml(value).replaceAll('"', "&quot;");
}
