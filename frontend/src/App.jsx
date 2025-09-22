import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- Configuration ---
const API_BASE_URL = 'http://127.0.0.1:8000';
const REGISTRATION_BASE_URL = 'http://localhost:5173/register';

// --- Styles ---
const styles = `
  :root { --primary-color: #4a90e2; --secondary-color: #f5f7fa; --text-color: #333; --border-color: #e1e4e8; --danger-color: #d9534f; --success-color: #5cb85c; --pending-color: #f0ad4e; --blocked-color: #777; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; background-color: var(--secondary-color); color: var(--text-color); }
  .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
  .form-container { max-width: 450px; margin: 5rem auto; padding: 2.5rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
  h1, h2, h3 { color: var(--primary-color); }
  .form-group { margin-bottom: 1.5rem; text-align: left; }
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
  input, select, textarea { width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; box-sizing: border-box; transition: all 0.2s; font-size: 1rem; }
  select[multiple] { height: 120px; }
  .btn { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background-color: var(--primary-color); color: white; }
  .btn:hover { opacity: 0.9; }
  .btn:disabled { background-color: #ccc; cursor: not-allowed; }
  .btn.btn-primary { background-color: var(--primary-color); color: white; }
  .btn.btn-danger { background-color: var(--danger-color); color: white; }
  .btn.btn-success { background-color: var(--success-color); color: white; }
  .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
  .btn-secondary { background-color: #6c757d; color: white; }
  .btn-secondary:hover { background-color: #5a6268; }
  .btn-warning { background-color: var(--pending-color); color: white; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .page-header .action-group { display: flex; gap: 1rem; }
  .status-badge { padding: 0.25em 0.6em; font-size: 0.75rem; font-weight: 700; border-radius: 2em; text-transform: uppercase; }
  .status-pending { background-color: var(--pending-color); color: white; } .status-approved { background-color: var(--success-color); color: white; } .status-blocked { background-color: var(--blocked-color); color: white; }
  .message-box { margin-top: 1rem; text-align:center; padding: 0.8rem; border-radius: 4px; }
  .error-message { color: var(--danger-color); background-color: rgba(217, 83, 79, 0.1); }
  .success-message { color: var(--success-color); background-color: rgba(92, 184, 92, 0.1); }
  .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 1200px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
  .nav-tabs { display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 2rem; }
  .nav-tab { padding: 1rem 1.5rem; cursor: pointer; font-weight: 600; color: #586069; border-bottom: 3px solid transparent; }
  .nav-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .tag { background-color: #e1e4e8; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
  .tag.tag-staff { background-color: #d4edda; color: #155724; }
  .invitation-link-container { margin-top: 1.5rem; padding: 1rem; background-color: var(--secondary-color); border: 1px dashed var(--border-color); border-radius: 4px; word-break: break-all; }
  .anex-table input, .anex-table select { padding: 0.5rem; font-size: 0.9rem; }
  .amount-payable { color: var(--danger-color); font-weight: bold; }
  .amount-paid { color: var(--success-color); font-weight: bold; }
  .filter-container { background: #fff; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
  .filter-item { display: flex; flex-direction: column; }
  .filter-item label { font-size: 0.875rem; margin-bottom: 0.4rem; color: #586069; }
  .filter-item input { padding: 0.6rem; font-size: 0.9rem; }
  .filter-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
  .change-detail ul { margin: 0; padding-left: 1.2rem; } .change-detail li { margin-bottom: 0.3rem; font-size: 0.9rem; }
  .change-before { color: #c93a40; background-color: #fde8e8; padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace;}
  .change-after { color: #2e7d32; background-color: #e7f4e4; padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace; }
  .final-warning { font-size: 1.2rem; color: var(--danger-color); font-weight: bold; text-align: center; }
  .patient-info-box { padding: 1rem; background-color: var(--secondary-color); border-radius: 6px; margin-bottom: 1.5rem; text-align: center; }
`;

// --- API Client & Helper ---
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
}, (error) => Promise.reject(error));

const FormModal = ({ title, children, onClose, onSubmit, apiError }) => (
    <div className="modal-backdrop">
        <div className="modal-content" style={{maxWidth: '600px'}}>
            <h2>{title}</h2>
            <form onSubmit={onSubmit}>
                {children}
                {apiError && <p className="error-message message-box">{apiError}</p>}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>უკან</button>
                    <button type="submit" className="btn btn-primary">შენახვა</button>
                </div>
            </form>
        </div>
    </div>
);


// --- Form Field Components ---
const UserFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>სახელი</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>გვარი</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>ელ. ფოსტა</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>მომხმარებელი</label><input type="text" name="user_name" value={formData.user_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>პაროლი</label><input type="password" name="password" placeholder={formData.id ? "Leave blank to keep current" : ""} onChange={handleChange} required={!formData.id} /></div>
    <div className="form-group">
        <label>თანამდებობა</label>
        <select name="role" value={formData.role || 'staff'} onChange={handleChange}>
            <option value="staff">თანამშრომელი</option>
            <option value="doctor">ექიმი</option>
            <option value="admin">ადმინისტრატორი</option>
        </select>
    </div>
</>);

const FinanceFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>დამფინანსებელი</label><input type="text" name="funder_name" value={formData.funder_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>ელ. ფოსტა</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>ტელეფონი</label><input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} /></div>
</>);

const ServiceFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>მომსახურების დასახელება</label><input type="text" name="service_number" value={formData.service_number || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>კვლევა</label><input type="text" name="research_name" value={formData.research_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>ლაბორატორია</label><input type="text" name="laboratory_name" value={formData.laboratory_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>ვადა</label><input type="date" name="deadline" value={formData.deadline || ''} onChange={handleChange} /></div>
</>);

const PatientFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>სახელი</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>გვარი</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>დაბადების თარიღი</label><input type="date" name="birth_date" value={formData.birth_date || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>პირადი ნომერი</label><input type="text" name="personal_number" value={formData.personal_number || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>მოქალაქეობა</label><input type="text" name="nationality" value={formData.nationality || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
    <div className="form-group"><label>მისამართი</label><input type="text" name="address" value={formData.address || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
</>);

// --- Reusable Modals ---
const InvitationModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [invitationLink, setInvitationLink] = useState('');
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!email) {
            setApiError("მიუთითე ელ. ფოსტა!");
            return;
        }
        setIsLoading(true);
        setApiError('');
        setInvitationLink('');
        try {
            const response = await apiClient.post('/admin/invitations/', { email });
            setInvitationLink(`${REGISTRATION_BASE_URL}?token=${response.data.token}`);
        } catch (error) {
            setApiError(error.response?.data?.detail || "ვერ მოხერხდა მოწვევის შექმნა.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{maxWidth: '600px'}}>
                <h2>შექმენი მოწვევის ბმული</h2>
                <div className="form-group">
                    <label>მომხმარებელის ელ. ფოსტა</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="შეიყვანე ელ. ფოსტა მოსაწვევად" />
                </div>
                {apiError && <p className="error-message message-box">{apiError}</p>}
                {invitationLink && (
                    <div className="invitation-link-container">
                        <p>მიეცი ეს ბმული მომხმარებელს:</p><code>{invitationLink}</code>
                    </div>
                )}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>დახურვა</button>
                    <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'მიმდინარეობს შექმნა...' : 'ბმულის შექმნა'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AnexModal = ({ user, patient, doctors, services, finances, onClose, onSave, apiError }) => {
    const [records, setRecords] = useState(JSON.parse(JSON.stringify(patient.anex_records || [])));
    const [editingRowIndex, setEditingRowIndex] = useState(null);

    const handleRecordChange = (index, field, value) => {
        const updatedRecords = [...records];
        updatedRecords[index][field] = value;
        setRecords(updatedRecords);
    };

    const handleAddRecord = () => {
        const newRecord = { doctor_id: '', service_id: '', finance_id: null, payable_amount: 0, paid_amount: 0 };
        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        setEditingRowIndex(updatedRecords.length - 1);
    };

    const handleDeleteRecord = (index) => {
        if (window.confirm("ნამდვილად გინდა ამ ჩანაწერის წაშლა?")) {
            setRecords(records.filter((_, i) => i !== index));
        }
    };
    
    const handleEditClick = (index) => {
        setEditingRowIndex(index);
    };

    const handleApplyRowChanges = (index) => {
        const record = records[index];
        if (!record.service_id) {
            alert("კვლევის მითითება აუცილებელია!");
            return;
        }
        setEditingRowIndex(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRowIndex !== null) {
            alert("შენახვამდე აუცილებელია მიმდინარე ცვლილების ასახვა.");
            return;
        }
        onSave(patient.id, records);
    };

    const findDoctorNameById = (id) => {
        if (id === null) return <span style={{color: '#888'}}>N/A</span>
        const doctor = doctors.find(d => d.id === id);
        return doctor ? `${doctor.first_name} ${doctor.last_name}` : 'არ არის არჩეული.';
    };
    const findServiceNameById = (id) => services.find(s => s.id === id)?.research_name || 'არ არის არჩეული.';
    const findFunderNameById = (id) => {
        if (id === null) return 'Patient Self-Funded';
        return finances.find(f => f.id === id)?.funder_name || 'არ არის არჩეული.';
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>დანართი: {patient.first_name} {patient.last_name}</h2>
                <form onSubmit={handleSubmit}>
                    <table className="anex-table">
                        <thead>
                            <tr>
                                <th>ექიმი</th>
                                <th>კვლევა</th>
                                <th>დამფინანსებელი</th>
                                <th style={{width: '130px'}}>გადასახდელი</th>
                                <th style={{width: '130px'}}>გადახდილი</th>
                                <th style={{width: '180px'}}>მოქმედება</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec, index) => (
                                <tr key={rec.id || `new-${index}`}>
                                    {editingRowIndex === index ? (
                                        <>
                                            <td>
                                                <select value={rec.doctor_id || ''} onChange={e => handleRecordChange(index, 'doctor_id', e.target.value ? parseInt(e.target.value) : null)}>
                                                    <option value="">აირჩიე ექიმი</option>
                                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={rec.service_id} onChange={e => handleRecordChange(index, 'service_id', parseInt(e.target.value))} required>
                                                    <option value="">აირჩიე კვლევა</option>
                                                    {services.map(s => <option key={s.id} value={s.id}>{s.research_name}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={rec.finance_id === null ? 'self' : rec.finance_id} onChange={e => handleRecordChange(index, 'finance_id', e.target.value === 'self' ? null : parseInt(e.target.value))}>
                                                    <option value="self">თვითონ</option>
                                                    {finances.map(f => <option key={f.id} value={f.id}>{f.funder_name}</option>)}
                                                </select>
                                            </td>
                                            <td><input className="amount-payable" type="number" step="0.01" value={rec.payable_amount} onChange={e => handleRecordChange(index, 'payable_amount', parseFloat(e.target.value) || 0)} /></td>
                                            <td><input className="amount-paid" type="number" step="0.01" value={rec.paid_amount} onChange={e => handleRecordChange(index, 'paid_amount', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="actions">
                                                <button type="button" className="btn btn-success btn-sm" onClick={() => handleApplyRowChanges(index)}>ასახვა</button>
                                                {user && user.role === 'admin' && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(index)}>წაშლა</button>}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{findDoctorNameById(rec.doctor_id)}</td>
                                            <td>{findServiceNameById(rec.service_id)}</td>
                                            <td>{findFunderNameById(rec.finance_id)}</td>
                                            <td><span className="amount-payable">${(rec.payable_amount || 0).toFixed(2)}</span></td>
                                            <td><span className="amount-paid">${(rec.paid_amount || 0).toFixed(2)}</span></td>
                                            <td className="actions">
                                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEditClick(index)}>ჩასწორება</button>
                                                {user && user.role === 'admin' && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(index)}>წაშლა</button>}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="btn btn-secondary" style={{marginTop: '1rem'}} onClick={handleAddRecord} disabled={editingRowIndex !== null}>ჩანაწერის დამატება</button>
                    {apiError && <p className="error-message message-box">{apiError}</p>}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>უკან</button>
                        <button type="submit" className="btn btn-primary">ცვლილებების შენახვა</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Auth Components ---
const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/token', new URLSearchParams({ username, password }));
      const token = response.data.access_token;
      localStorage.setItem('accessToken', token);
      onLoginSuccess(token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "აუთენტიფიკაციის შეცდომა.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>აუთენტიფიკაცია</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>მომხმარებელი</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
        <div className="form-group"><label>პაროლი</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="error-message message-box">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'მიმდინარეობს აუთენტიფიკაცია...' : 'აუთენტიფიკაცია'}</button>
      </form>
    </div>
  );
};

const Registration = () => {
    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', user_name: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) { setError("სარეგისტრაციო ტოკენი ვერ იქნა ნაპოვნი."); return; }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            await apiClient.post(`/users/?token=${token}`, formData);
            setSuccess("რეგისტრაცია წარმატებით დასრულდა! დაელოდე ადმინისტრატორის დადასტურებას. შეგიძლია დახურო ეს ფანჯარა.");
        } catch (err) {
            setError(err.response?.data?.detail || "რეგისტრაცია ვერ განხორციელდა.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (success) { return <div className="form-container"><p style={{color: 'var(--success-color)'}}>{success}</p></div> }

    return (
        <div className="form-container">
            <h2>შექმენი შენი ანგარიში</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>სახელი</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>გვარი</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>ელ. ფოსტა</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                <div className="form-group"><label>მომხმარებელი</label><input type="text" name="user_name" value={formData.user_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>პაროლი</label><input type="password" name="password" onChange={handleChange} required /></div>
                {error && <p className="error-message message-box">{error}</p>}
                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'რეგისტრაციის მიმდინარეობა...' : 'რეგისტრაცია'}</button>
            </form>
        </div>
    );
};

const DeletePatientModal = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [personalNumber, setPersonalNumber] = useState('');
    const [password, setPassword] = useState('');
    const [patientInfo, setPatientInfo] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleFindPatient = async (e) => {
        e.preventDefault();
        if (!personalNumber) {
            setMessage({ type: 'error', text: 'მიუთითე პირადი ნომერი.' });
            return;
        }
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await apiClient.get(`/admin/find-patient/${personalNumber}`);
            setPatientInfo(response.data);
            setStep(2);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'პაციენტი ვერ იქნა ნაპოვნი.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalDelete = async () => {
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await apiClient.post('/admin/delete-patient', { personal_number: personalNumber, password });
            onSuccess(); // This will close the modal and refresh the list
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'წაშლა ვერ განხორციელდა.' });
            setStep(2); // Go back to password step on failure
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <form onSubmit={handleFindPatient}>
                        <p>შეიყვანე პაციენტი პირადი ნომერი რომლის წაშლაც გსურს სამუდამოდ.</p>
                        <div className="form-group">
                            <label>პირადი ნომერი</label>
                            <input type="text" value={personalNumber} onChange={e => setPersonalNumber(e.target.value)} required autoFocus/>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>უკან</button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'მიმდინარეობს პოვნა...' : 'პაციენტის პოვნა'}</button>
                        </div>
                    </form>
                );
            case 2:
                return (
                       <form onSubmit={(e) => { e.preventDefault(); setMessage({type:'',text:''}); setStep(3); }}>
                           <div className="patient-info-box">
                               <p>აპირებ წაშლას:</p>
                               <h3>{patientInfo.first_name} {patientInfo.last_name}</h3>
                               <p>(პირადი ნომერი: {patientInfo.personal_number})</p>
                           </div>
                           <p>გასაგრძელებლად შეიყვანე ადმინისტრატორის პაროლი.</p>
                            <div className="form-group">
                                 <label>პაროლი</label>
                                 <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus/>
                            </div>
                            <div className="modal-footer">
                                 <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>უკან</button>
                                 <button type="submit" className="btn btn-danger">გაგრძელება</button>
                            </div>
                       </form>
                );
            case 3:
                return (
                    <div>
                        <div className="patient-info-box">
                            <p className="final-warning">პაციენტთან ერთედ წაიშლება ყველა მასთან დაკავშირებული მონაცემი!</p>
                            <p>მოქმედება შეუქცევადია. მონაცემების აღდგენა შეუძებელია.</p>
                        </div>
                        <div className="modal-footer">
                             <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>უკან</button>
                             <button type="button" className="btn btn-success" style={{flexGrow: 1}} onClick={handleFinalDelete} disabled={isLoading}>
                                 {isLoading ? 'მიმდინარეობს წაშლა...' : 'დადასტურება'}
                             </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{maxWidth: '500px'}}>
                <h2>პაციენტის უსაფრთხოდ წაშლა</h2>
                {message.text && <div className={`message-box ${message.type}-message`}>{message.text}</div>}
                {renderStep()}
            </div>
        </div>
    );
};

// --- Page Views ---
const PatientsView = ({ user }) => {
    const initialFilters = { personal_number: '', lastname: '', firstname: '', doctor: '', funder: '', research: '', staff: '' };
    const [patients, setPatients] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [anexPatient, setAnexPatient] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [allFinances, setAllFinances] = useState([]);
    const [apiError, setApiError] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const doctors = useMemo(() => allUsers.filter(u => u.role === 'doctor' || u.role === 'admin'), [allUsers]);
    
    const fetchPatients = useCallback(async (currentFilters) => {
        try {
            setApiError('');
            const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v !== ''));
            const patientsRes = await apiClient.get('/patients/', { params: activeFilters });
            setPatients(patientsRes.data);
        } catch(e) {
            console.error("პაციენტების პოვნა ვერ განხორციელდა:", e);
            setApiError("პაციენტები ვერ ჩამოიტვირთა. ისევ სცადე.");
        }
    }, []);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [servicesRes, financesRes, usersRes] = await Promise.all([
                    apiClient.get('/services/'),
                    apiClient.get('/finances/'),
                    apiClient.get('/users/list')
                ]);
                setAllServices(servicesRes.data);
                setAllFinances(financesRes.data);
                setAllUsers(usersRes.data);
            } catch(e) {
                console.error("Failed to fetch dependencies:", e);
                setApiError("Failed to load page dependency data. Please try again later.");
            }
        };
        fetchDependencies();
        fetchPatients(filters);
    }, [fetchPatients]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(filters);
    };

    const handleClearSearch = () => {
        setFilters(initialFilters);
        fetchPatients(initialFilters);
    };

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/patients/${formData.id}` : '/patients/';
        try {
            setApiError('');
            await apiClient[method](url, formData);
            setEditingItem(null);
            handleClearSearch();
        } catch (error) {
            setApiError(error.response?.data?.detail || `პაციენტი არ შეინახა.`);
        }
    };
    
    const handleSaveAnex = async (patientId, records) => {
        try {
            setApiError('');
            await apiClient.put(`/patients/${patientId}/anex`, records);
            setAnexPatient(null);
            handleClearSearch();
        } catch (error) {
            setApiError(error.response?.data?.detail || 'დნართის დეტალები ვერ შეინახა.');
        }
    };
    
    const handleEditClick = (item) => {
        setEditingItem({ ...item });
        setApiError('');
    };

    const handleAddClick = () => {
        setEditingItem({});
        setApiError('');
    };

    const handleAnexClick = (patient) => {
        setAnexPatient(patient);
        setApiError('');
    };
    
    const handleFormChange = (name, value) => {
        setEditingItem(prev => ({ ...prev, [name]: value }));
    };

    return (<div>
        {isDeleteModalOpen && <DeletePatientModal 
            onClose={() => setIsDeleteModalOpen(false)}
            onSuccess={() => {
                setIsDeleteModalOpen(false);
                handleClearSearch();
            }}
        />}

        {editingItem && <FormModal 
            title={editingItem.id ? "ჩაასწორე პაციენტი" : "შეინახე პაციენტი"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
        >
            <PatientFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}

        {anexPatient && <AnexModal 
            user={user}
            patient={anexPatient}
            doctors={doctors}
            services={allServices}
            finances={allFinances}
            onClose={() => setAnexPatient(null)}
            onSave={handleSaveAnex}
            apiError={apiError}
        />}

        <div className="page-header">
            <h2>მართე პაციენტები</h2>
            <div className="action-group">
                <button className="btn btn-primary" onClick={handleAddClick}>დაამატე პაციენტი</button>
                {user.role === 'admin' && (
                    <button className="btn btn-danger" onClick={() => setIsDeleteModalOpen(true)}>წაშალე პაციენტი</button>
                )}
            </div>
        </div>
        
        <div className="filter-container">
            <form onSubmit={handleSearch}>
                <div className="filter-grid">
                    <div className="filter-item"><label>პირადი ნომერი</label><input type="text" name="personal_number" value={filters.personal_number} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>გვარი</label><input type="text" name="lastname" value={filters.lastname} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>სახელი</label><input type="text" name="firstname" value={filters.firstname} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>ექიმი</label><input type="text" name="doctor" value={filters.doctor} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>დამფინანსებელი</label><input type="text" name="funder" value={filters.funder} onChange={handleFilterChange} placeholder="Enter name or 'self'" /></div>
                    <div className="filter-item"><label>კვლევა</label><input type="text" name="research" value={filters.research} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>თანამშრომელი</label><input type="text" name="staff" value={filters.staff} onChange={handleFilterChange} /></div>
                </div>
                <div className="filter-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>გაწმენდა</button>
                    <button type="submit" className="btn btn-primary">ძებნა</button>
                </div>
            </form>
        </div>

        {apiError && !editingItem && !anexPatient && <p className="error-message message-box">{apiError}</p>}
        <table>
            <thead><tr><th>პირადი ნომერი.</th><th>სახელი</th><th>დაბადების თარიღი</th><th>ავტორი</th><th>მოქმედებები</th></tr></thead>
            <tbody>
                {patients.map(item => <tr key={item.id}>
                    <td>{item.personal_number}</td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.birth_date}</td>
                    <td>
                        <div className="tag-list">
                            {item.staff_assigned.map(u => 
                                <span key={u.id} className="tag tag-staff">{u.user_name}</span>
                            )}
                        </div>
                    </td>
                    <td className="actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAnexClick(item)}>დანართი</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>ჩასწორება</button>
                    </td>
                </tr>)}
            </tbody>
        </table>
    </div>);
};

// --- MODIFIED: Entire UsersView component updated ---
const UsersView = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [approvalRoles, setApprovalRoles] = useState({});
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const [apiError, setApiError] = useState('');
    
    const fetchUsers = useCallback(async () => { try { setUsers((await apiClient.get('/admin/users/')).data); } catch (e) { console.error("Failed to fetch users:", e); } }, []);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSave = async (formData) => {
        const data = {...formData};
        if (editingUser.id && !data.password) delete data.password;
        const method = editingUser.id ? 'put' : 'post';
        const url = editingUser.id ? `/admin/users/${editingUser.id}` : '/admin/users/';
        try {
            await apiClient[method](url, data);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            setApiError(error.response?.data?.detail || "მომხმარებელი ვერ შეინახა.");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("ნამდვილად გინდა ამ მომხმარებლის სამუდამოდ წაშლა? წაშლა შეუქცევადია!")) {
            try {
                await apiClient.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.detail || "მომხმარებელი ვერ წაიშალა.");
            }
        }
    };

    const handleApprove = async (userId) => {
        try {
            const role = approvalRoles[userId] || 'staff';
            await apiClient.post(`/admin/users/${userId}/approve`, { role });
            fetchUsers();
        } catch(error) {
            alert(error.response?.data?.detail || "Failed to approve user.");
        }
    };

    const handleBlock = async (userId, is_blocked) => {
        const action = is_blocked ? "ბლოკის დადება" : "ბლოკის მოხსნა";
        if (window.confirm(`ნამდვილად გინდა ამ მომხმარებლზე ${action} ?`)) {
            try {
                await apiClient.post(`/admin/users/${userId}/block`, { is_blocked });
                fetchUsers();
            } catch(error) {
                alert(error.response?.data?.detail || `ვერ მოდა მიმდინარე მომხმარებელზე ${action} .`);
            }
        }
    };
    
    const handleFormChange = (e) => {
        setEditingUser(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleAddClick = () => {
        setEditingUser({ role: 'staff' });
        setApiError('');
    }

    const handleEditClick = (user) => {
        setEditingUser(user);
        setApiError('');
    }
    
    const getStatus = (item) => {
        if (item.is_blocked) {
            return <span className="status-badge status-blocked">დაბლოკილი</span>;
        }
        if (item.is_approved) {
            return <span className="status-badge status-approved">დადასტურებული</span>;
        }
        return <span className="status-badge status-pending">დაკიდებული</span>;
    };

    return (<div>
        {editingUser && <FormModal 
            title={editingUser.id ? "მომხმარებლის ჩასწორება" : "მომხმარებლის დამატება"} 
            onClose={() => setEditingUser(null)} 
            onSubmit={(e) => { e.preventDefault(); handleSave(editingUser); }}
            apiError={apiError}
        >
            <UserFormFields formData={editingUser} handleChange={handleFormChange} />
        </FormModal>}
        
        {isInvitationModalOpen && <InvitationModal onClose={() => setIsInvitationModalOpen(false)} />}
        
        <div className="page-header">
            <h2>მომხმარებლის მართვა</h2>
            <div className="action-group">
                <button className="btn btn-secondary" onClick={() => setIsInvitationModalOpen(true)}>მოწვევის შექმნა</button>
                <button className="btn btn-primary" onClick={handleAddClick}>მომხმარებლის დამატება ხელით</button>
            </div>
        </div>
        <table><thead><tr><th>სახელი</th><th>ელ. ფოსტა</th><th>მომხმარებელი</th><th>თანამდებობა</th><th>სტატუსი</th><th>მოქმედებები</th></tr></thead><tbody>
            {users.map(item => (<tr key={item.id}>
                <td>{item.first_name} {item.last_name}</td><td>{item.email}</td><td>{item.user_name}</td>
                <td>{item.role}</td>
                <td>{getStatus(item)}</td>
                <td className="actions">
                    {!item.is_approved ? (
                        <>
                            <select 
                                value={approvalRoles[item.id] || 'staff'} 
                                onChange={(e) => setApprovalRoles(prev => ({...prev, [item.id]: e.target.value}))}
                                style={{width: '100px', marginRight: '0.5rem'}}
                            >
                                <option value="staff">თანამშრომელი</option>
                                <option value="doctor">ექიმი</option>
                            </select>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(item.id)}>დადასტურება</button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>ჩასწორება</button>
                            {item.is_blocked ? (
                                <button className="btn btn-success btn-sm" onClick={() => handleBlock(item.id, false)}>ბლოკის მოხსნა</button>
                            ) : (
                                <button className="btn btn-warning btn-sm" onClick={() => handleBlock(item.id, true)}>ბლოკის დადება</button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>წაშლა</button>
                        </>
                    )}
                </td>
            </tr>))}
        </tbody></table>
    </div>);
};

const FinanceView = ({ user }) => {
    const [finances, setFinances] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [apiError, setApiError] = useState('');

    const fetchItems = useCallback(async () => { try { setFinances((await apiClient.get('/finances/')).data); } catch(e) { console.error("ვერ მოხდა ფინანსების წამოღება:", e) } }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/finances/${formData.id}` : '/finances/';
        try {
            await apiClient[method](url, formData);
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            setApiError(error.response?.data?.detail || "ვერ მოხდა ფინანსური ჩანაწერის მონაცემების შენახვა.");
        }
    };
    
    const handleDelete = async (id) => { 
        if (window.confirm("წაიშალოს მოცემული ფინანსური ჩანაწერი?")) { 
            try {
                await apiClient.delete(`/finances/${id}`); 
                fetchItems(); 
            } catch(error) {
                alert(error.response?.data?.detail || "ვერ განხორციელდა ჩანაწერის წაშლა.");
            }
        } 
    };
    
    const handleFormChange = (e) => {
        setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleAddClick = () => {
        setEditingItem({});
        setApiError('');
    }

    const handleEditClick = (item) => {
        setEditingItem(item);
        setApiError('');
    }

    return (<div>
        {editingItem && <FormModal 
            title={editingItem.id ? "ფინანსური ჩანაწერის ჩასწორება" : "ფინანსური ჩანაწერის დამატება"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
        >
            <FinanceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>ფინანსების მართვა</h2><button className="btn btn-primary" onClick={handleAddClick}>ჩანაწერის დამატება</button></div>
        <table><thead><tr><th>დამფინანსებელი</th><th>ელ. ფოსტა</th><th>ტელეფონი</th><th>მოქმედებები</th></tr></thead><tbody>
            {finances.map(item => <tr key={item.id}><td>{item.funder_name}</td><td>{item.email}</td><td>{item.phone_number}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>ჩასწორება</button>
                {user.role === 'admin' && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>წაშლა</button>}
            </td></tr>)}
        </tbody></table>
    </div>);
};

const ServicesView = ({ user }) => {
    const [services, setServices] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [apiError, setApiError] = useState('');

    const fetchItems = useCallback(async () => { try { setServices((await apiClient.get('/services/')).data); } catch(e) { console.error("Failed to fetch services:", e) } }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/services/${formData.id}` : '/services/';
        try {
            await apiClient[method](url, formData);
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            setApiError(error.response?.data?.detail || "ვერ შეინახა მომსახურების ჩანაწერი.");
        }
    };
    const handleDelete = async (id) => { 
        if (window.confirm("წაიშალოს მოცემული ჩანაწერი?")) { 
            try {
                await apiClient.delete(`/services/${id}`); 
                fetchItems();
            } catch (error) {
                alert(error.response?.data?.detail || "ვერ წაიშალა ჩანაწერი.");
            }
        } 
    };

    const handleFormChange = (e) => {
        setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleAddClick = () => {
        setEditingItem({});
        setApiError('');
    }

    const handleEditClick = (item) => {
        setEditingItem(item);
        setApiError('');
    }

    return (<div>
        {editingItem && <FormModal 
            title={editingItem.id ? "მომსახურების ჩანაწერის ჩასწორება" : "მომსახურების ჩანაწერის დამატება"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
            >
            <ServiceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>მომსახურებების მართვა</h2><button className="btn btn-primary" onClick={handleAddClick}>ჩანაწერის დამატება</button></div>
        <table><thead><tr><th>მომსახურების ნომერი</th><th>კვლევა</th><th>ლაბორატორია</th><th>ვადა</th><th>მოქმედებები</th></tr></thead><tbody>
            {services.map(item => <tr key={item.id}><td>{item.service_number}</td><td>{item.research_name}</td><td>{item.laboratory_name}</td><td>{item.deadline}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>ჩასწორება</button>
                {user.role === 'admin' && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>წაშლა</button>}
            </td></tr>)}
        </tbody></table>
    </div>);
};

const ChangesDetail = ({ action, changes }) => {
    const renderValue = (value) => {
        if (value === null) return <span className="change-before">null</span>;
        if (typeof value === 'boolean') return value ? <span className="change-after">true</span> : <span className="change-before">false</span>;
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return `"${value}"`;
    };

    if (action === 'CREATE' || action === 'DELETE') {
        return (
            <div className="change-detail">
                <ul>
                    {Object.entries(changes).map(([key, value]) => (
                        <li key={key}><strong>{key}:</strong> {renderValue(value)}</li>
                    ))}
                </ul>
            </div>
        );
    }
    if (action === 'UPDATE' || action === 'BLOCK' || action === 'UNBLOCK') {
        return (
             <div className="change-detail">
                 <ul>
                    {Object.entries(changes).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> 
                            <span className="change-before">{renderValue(value.before)}</span>
                             {' → '}
                            <span className="change-after">{renderValue(value.after)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )
    }
    return <pre>{JSON.stringify(changes, null, 2)}</pre>;
};

const HistoryView = ({ user }) => {
    const initialFilters = { author: '', date: '', patient: '' };
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [apiError, setApiError] = useState('');

    const fetchHistory = useCallback(async (currentFilters) => {
        try {
            setApiError('');
            const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v));
            const response = await apiClient.get('/history/', { params: activeFilters });
            setLogs(response.data);
        } catch (e) {
            console.error("ვერ მოხდა ცვლილებების ისტორიის წამოღება:", e);
            setApiError("ვერ მოხდა ცვლილებების ისტორიის ჩამოტვირთვა. ისევ სცადე.");
        }
    }, []);

    useEffect(() => {
        fetchHistory(filters);
    }, [fetchHistory]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchHistory(filters);
    };

    const handleClearSearch = () => {
        setFilters(initialFilters);
        fetchHistory(initialFilters);
    };

    return (
        <div>
            <div className="page-header"><h2>ცვლილებების ისტორია</h2></div>
            <div className="filter-container">
                <form onSubmit={handleSearch}>
                    <div className="filter-grid">
                        <div className="filter-item"><label>ავტორი (მომხმარებელი)</label><input type="text" name="author" value={filters.author} onChange={handleFilterChange} /></div>
                        <div className="filter-item"><label>თარიღი</label><input type="date" name="date" value={filters.date} onChange={handleFilterChange} /></div>
                        <div className="filter-item"><label>პაციენტი (სახელი ან პირადი ნომერი)</label><input type="text" name="patient" value={filters.patient} onChange={handleFilterChange} /></div>
                    </div>
                    <div className="filter-actions">
                        <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>გაწმენდა</button>
                        <button type="submit" className="btn btn-primary">ძებნა</button>
                    </div>
                </form>
            </div>
            {apiError && <p className="error-message message-box">{apiError}</p>}
            <table>
                <thead>
                    <tr>
                        <th style={{width: '180px'}}>Date</th>
                        <th>ავტორი</th>
                        <th>მოქმედება</th>
                        <th>ერთეული</th>
                        <th>პაციენტის კონტექსტი</th>
                        <th>დეტალები</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{log.user ? log.user.user_name : <span style={{color: '#888'}}>წაშლილი მომხმარებელი</span>}</td>
                            <td>{log.action}</td>
                            <td>{log.entity_type} #{log.entity_id}</td>
                            <td>
                                {log.patient 
                                    ? `${log.patient.first_name} ${log.patient.last_name} (#${log.patient.personal_number})` 
                                    : <span style={{color: '#888'}}>N/A</span>}
                            </td>
                            <td>
                                <ChangesDetail action={log.action} changes={log.changes} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Main Components ---
const Dashboard = ({ user, handleLogout }) => {
    const [activeView, setActiveView] = useState('patients');
    const NavTab = ({ view, label }) => (<div className={`nav-tab ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}>{label}</div>);
    
    return ( 
        <div className="container">
            <div className="page-header"><h1>მართვის პანელი</h1><button className="btn btn-secondary" onClick={handleLogout}>გამოსვლა</button></div>
            <nav className="nav-tabs">
                <NavTab view="patients" label="პაციენტები" />
                {user.role === 'admin' && <NavTab view="users" label="მომხმარებლები" />}
                <NavTab view="finance" label="ფინანსები" />
                <NavTab view="services" label="მომსახურებები" />
                <NavTab view="history" label="ცვლილებების ისტორია" />
            </nav>
            {activeView === 'patients' && <PatientsView user={user} />}
            {activeView === 'users' && user.role === 'admin' && <UsersView user={user} />}
            {activeView === 'finance' && <FinanceView user={user} />}
            {activeView === 'services' && <ServicesView user={user} />}
            {activeView === 'history' && <HistoryView user={user} />}
        </div> 
    );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
                setUser({ role: decoded.role, username: decoded.sub });
            } else {
                localStorage.removeItem('accessToken');
            }
        } catch (error) {
            console.error("ტოკენი არ არის ვალიდური");
            localStorage.removeItem('accessToken');
        }
    }
    setLoading(false);
  }, []);
  
  const handleLoginSuccess = (token) => {
    try {
        const decoded = jwtDecode(token);
        setUser({ role: decoded.role, username: decoded.sub });
    } catch (error) {
        console.error("ვერ გაიშიფრა აუთენთიფიკაციის ტოკენი", error);
    }
  };
  
  const handleLogout = (navigate) => {
    localStorage.removeItem('accessToken');
    setUser(null);
    navigate('/login');
  };
  
  const ProtectedRoute = ({ children }) => { 
    const navigate = useNavigate(); 
    useEffect(() => { 
        if (!loading && !user) {
            navigate('/login'); 
        }
    }, [user, loading, navigate]); 
    
    if (loading) {
        return null;
    }

    return user ? React.cloneElement(children, { user, handleLogout: () => handleLogout(navigate) }) : null; 
  };
  
  return ( 
    <> 
      <style>{styles}</style> 
      <BrowserRouter> 
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes> 
      </BrowserRouter> 
    </> 
  );
}

export default App;

