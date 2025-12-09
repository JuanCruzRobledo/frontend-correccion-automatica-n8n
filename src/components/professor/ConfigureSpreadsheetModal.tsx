import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import rubricService from '../../services/rubricService';
import type { Rubric } from '../../types';

interface ConfigureSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubric: Rubric;
  onSaved: (rubric: Rubric) => void;
}

const extractSpreadsheetId = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) {
    return match[1];
  }
  return trimmed.split('?')[0];
};

export const ConfigureSpreadsheetModal = ({
  isOpen,
  onClose,
  rubric,
  onSaved,
}: ConfigureSpreadsheetModalProps) => {
  const [spreadsheetValue, setSpreadsheetValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rubric) {
      setSpreadsheetValue(rubric.spreadsheet_file_url || rubric.spreadsheet_file_id || '');
    }
  }, [rubric]);

  const derivedId = useMemo(() => {
    if (!spreadsheetValue.trim()) return '';
    return extractSpreadsheetId(spreadsheetValue);
  }, [spreadsheetValue]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!derivedId) {
        setError('Debes ingresar un ID o URL de Google Sheets');
        return;
      }

      const updated = await rubricService.updateSpreadsheet(rubric.rubric_id, {
        spreadsheet_file_id: derivedId,
        spreadsheet_file_url: spreadsheetValue.includes('http') ? spreadsheetValue.trim() : rubric.spreadsheet_file_url,
      });

      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al guardar la planilla'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar planilla de Google Sheets"
      size="md"
      showFooter
      confirmText="Guardar"
      confirmLoading={saving}
      onConfirm={handleSave}
    >
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">
          Pega el ID o la URL completa de la planilla en Google Sheets que contiene las correcciones.
        </p>

        <Input
          label="ID o URL de la planilla"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={spreadsheetValue}
          onChange={(e) => setSpreadsheetValue(e.target.value)}
        />

        <div className="rounded-lg bg-bg-tertiary/60 border border-border-secondary p-3">
          <p className="text-xs text-text-secondary">Se detectará el siguiente ID:</p>
          <p className="text-sm font-mono text-text-primary mt-1">
            {derivedId || '— Sin ID —'}
          </p>
        </div>

        {error && (
          <div className="bg-danger-1/10 border border-danger-1/40 text-danger-1 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfigureSpreadsheetModal;
