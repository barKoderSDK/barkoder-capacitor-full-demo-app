import icon1D from '../assets/icons/icon_1d.svg';
import icon2D from '../assets/icons/icon_2d.svg';
import iconAr from '../assets/icons/icon_ar.svg';
import iconBlur from '../assets/icons/icon_blur.svg';
import iconContinuous from '../assets/icons/icon_continuous.svg';
import iconDotCode from '../assets/icons/icon_dotcode.svg';
import iconDpm from '../assets/icons/icon_dpm.svg';
import iconGallery from '../assets/icons/icon_gallery.svg';
import iconMrz from '../assets/icons/icon_mrz.svg';
import iconMultiscan from '../assets/icons/icon_multiscan.svg';
import iconVin from '../assets/icons/icon_vin.svg';
import type { HomeSection } from '../types/types';

export const BARCODE_TYPES_1D = [
  { id: 'australianPost', label: 'Australian Post' },
  { id: 'codabar', label: 'Codabar' },
  { id: 'code11', label: 'Code 11' },
  { id: 'code128', label: 'Code 128' },
  { id: 'code25', label: 'Code 2 of 5 Standard' },
  { id: 'code32', label: 'Code 32' },
  { id: 'code39', label: 'Code 39' },
  { id: 'code93', label: 'Code 93' },
  { id: 'coop25', label: 'COOP 25' },
  { id: 'datalogic25', label: 'Code 2 of 5 Datalogic' },
  { id: 'databar14', label: 'GS1 Databar 14' },
  { id: 'databarExpanded', label: 'GS1 Databar Expanded' },
  { id: 'databarLimited', label: 'GS1 Databar Limited' },
  { id: 'ean13', label: 'EAN 13' },
  { id: 'ean8', label: 'EAN 8' },
  { id: 'iata25', label: 'IATA 25' },
  { id: 'interleaved25', label: 'Interleaved 2 of 5' },
  { id: 'itf14', label: 'ITF 14' },
  { id: 'japanesePost', label: 'Japanese Post' },
  { id: 'kix', label: 'KIX' },
  { id: 'matrix25', label: 'Matrix 25' },
  { id: 'msi', label: 'MSI' },
  { id: 'planet', label: 'Planet' },
  { id: 'postalIMB', label: 'Postal IMB' },
  { id: 'postnet', label: 'Postnet' },
  { id: 'royalMail', label: 'Royal Mail' },
  { id: 'telepen', label: 'Telepen' },
  { id: 'upcA', label: 'UPC-A' },
  { id: 'upcE', label: 'UPC-E' },
  { id: 'upcE1', label: 'UPC-E1' },
];

export const BARCODE_TYPES_2D = [
  { id: 'aztec', label: 'Aztec' },
  { id: 'aztecCompact', label: 'Aztec Compact' },
  { id: 'datamatrix', label: 'Datamatrix' },
  { id: 'dotcode', label: 'Dotcode' },
  { id: 'idDocument', label: 'ID Document' },
  { id: 'maxiCode', label: 'MaxiCode' },
  { id: 'ocrText', label: 'OCR Text' },
  { id: 'pdf417', label: 'PDF 417' },
  { id: 'pdf417Micro', label: 'PDF 417 Micro' },
  { id: 'qr', label: 'QR' },
  { id: 'qrMicro', label: 'QR Micro' },
];

export const MODES = {
  ANYSCAN: 'v1',
  MODE_1D: 'mode_1d',
  MODE_2D: 'mode_2d',
  CONTINUOUS: 'continuous',
  MULTISCAN: 'multiscan',
  VIN: 'vin',
  DPM: 'dpm',
  DEBLUR: 'deblur',
  DOTCODE: 'dotcode',
  AR_MODE: 'ar_mode',
  MRZ: 'mrz',
  GALLERY: 'gallery',
} as const;

export const SECTIONS: HomeSection[] = [
  {
    title: 'General Barcodes',
    data: [
      {
        id: '1d',
        label: '1D',
        icon: icon1D,
        mode: MODES.MODE_1D,
      },
      {
        id: '2d',
        label: '2D',
        icon: icon2D,
        mode: MODES.MODE_2D,
      },
      {
        id: 'continuous',
        label: 'Continuous',
        icon: iconContinuous,
        mode: MODES.CONTINUOUS,
      },
    ],
  },
  {
    title: 'Showcase',
    data: [
      {
        id: 'multiscan',
        label: 'MultiScan',
        icon: iconMultiscan,
        mode: MODES.MULTISCAN,
      },
      {
        id: 'vin',
        label: 'VIN',
        icon: iconVin,
        mode: MODES.VIN,
      },
      {
        id: 'dpm',
        label: 'DPM',
        icon: iconDpm,
        mode: MODES.DPM,
      },
      {
        id: 'deblur',
        label: 'DeBlur',
        icon: iconBlur,
        mode: MODES.DEBLUR,
      },
      {
        id: 'dotcode',
        label: 'DotCode',
        icon: iconDotCode,
        mode: MODES.DOTCODE,
      },
      {
        id: 'ar_mode',
        label: 'AR Mode',
        icon: iconAr,
        mode: MODES.AR_MODE,
      },
      {
        id: 'mrz',
        label: 'MRZ',
        icon: iconMrz,
        mode: MODES.MRZ,
      },
      {
        id: 'gallery',
        label: 'Gallery Scan',
        icon: iconGallery,
        mode: MODES.GALLERY,
      },
    ],
  },
];
