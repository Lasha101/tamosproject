import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = 'http://127.0.0.1:8000';
const REGISTRATION_BASE_URL = 'http://localhost:5173/register';

// --- Styles ---
const styles = `
  :root { --primary-color: #4a90e2; --secondary-color: #f5f7fa; --text-color: #333; --border-color: #e1e4e8; --danger-color: #d9534f; --success-color: #5cb85c; --pending-color: #f0ad4e; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; background-color: var(--secondary-color); color: var(--text-color); }
  .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
  .form-container { max-width: 450px; margin: 5rem auto; padding: 2.5rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
  h1, h2 { color: var(--primary-color); }
  .form-group { margin-bottom: 1.5rem; text-align: left; }
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
  input, select, textarea { width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; box-sizing: border-box; transition: all 0.2s; font-size: 1rem; }
  select[multiple] { height: 120px; }
  .btn { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background-color: var(--primary-color); color: white; }
  .btn:hover { opacity: 0.9; }
  .btn.btn-primary { background-color: var(--primary-color); color: white; }
  .btn.btn-danger { background-color: var(--danger-color); color: white; }
  .btn.btn-success { background-color: var(--success-color); color: white; }
  .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
  .btn-secondary { background-color: #6c757d; color: white; }
  .btn-secondary:hover { background-color: #5a6268; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .status-badge { padding: 0.25em 0.6em; font-size: 0.75rem; font-weight: 700; border-radius: 2em; text-transform: uppercase; }
  .status-pending { background-color: var(--pending-color); color: white; } .status-approved { background-color: var(--success-color); color: white; }
  .error-message { color: var(--danger-color); margin-top: 1rem; text-align:center; padding: 0.5rem; border-radius: 4px; background-color: rgba(217, 83, 79, 0.1); }
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
                {apiError && <p className="error-message" style={{marginTop: '1.5rem'}}>{apiError}</p>}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>
);


// --- Form Field Components ---
const UserFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Username</label><input type="text" name="user_name" value={formData.user_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Password</label><input type="password" name="password" placeholder={formData.id ? "Leave blank to keep current" : ""} onChange={handleChange} required={!formData.id} /></div>
    <div className="form-group">
        <label>Role</label>
        <select name="role" value={formData.role || 'staff'} onChange={handleChange}>
            <option value="staff">Staff</option>
            <option value="doctor">Doctor</option>
        </select>
    </div>
</>);

const FinanceFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>Funder Name</label><input type="text" name="funder_name" value={formData.funder_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Phone</label><input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} /></div>
</>);

const ServiceFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>Service Number</label><input type="text" name="service_number" value={formData.service_number || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Research Name</label><input type="text" name="research_name" value={formData.research_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Laboratory Name</label><input type="text" name="laboratory_name" value={formData.laboratory_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Deadline</label><input type="date" name="deadline" value={formData.deadline || ''} onChange={handleChange} /></div>
</>);

const PatientFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Birth Date</label><input type="date" name="birth_date" value={formData.birth_date || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Personal Number</label><input type="text" name="personal_number" value={formData.personal_number || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Nationality</label><input type="text" name="nationality" value={formData.nationality || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
    <div className="form-group"><label>Address</label><input type="text" name="address" value={formData.address || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
</>);

// --- Reusable Modals ---
const InvitationModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [invitationLink, setInvitationLink] = useState('');
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!email) {
            setApiError("Email is required.");
            return;
        }
        setIsLoading(true);
        setApiError('');
        setInvitationLink('');
        try {
            const response = await apiClient.post('/admin/invitations/', { email });
            setInvitationLink(`${REGISTRATION_BASE_URL}?token=${response.data.token}`);
        } catch (error) {
            setApiError(error.response?.data?.detail || "Failed to create invitation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content" style={{maxWidth: '600px'}}>
                <h2>Generate Invitation Link</h2>
                <div className="form-group">
                    <label>User's Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email to invite" />
                </div>
                {apiError && <p className="error-message">{apiError}</p>}
                {invitationLink && (
                    <div className="invitation-link-container">
                        <p>Share this link with the user:</p><code>{invitationLink}</code>
                    </div>
                )}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Generating...' : 'Generate Link'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AnexModal = ({ patient, doctors, services, finances, onClose, onSave, apiError }) => {
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
        setEditingRowIndex(updatedRecords.length - 1); // Automatically edit the new row
    };

    const handleDeleteRecord = (index) => {
        if (window.confirm("Are you sure you want to remove this record?")) {
            setRecords(records.filter((_, i) => i !== index));
        }
    };
    
    const handleEditClick = (index) => {
        setEditingRowIndex(index);
    };

    const handleApplyRowChanges = (index) => {
        // You could add validation here before exiting edit mode
        const record = records[index];
        if (!record.doctor_id || !record.service_id) {
            alert("Doctor and Research fields are required.");
            return;
        }
        setEditingRowIndex(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRowIndex !== null) {
            alert("Please apply changes to the currently editing row before saving.");
            return;
        }
        onSave(patient.id, records);
    };

    // Helper functions to find names for view mode
    const findDoctorNameById = (id) => {
        const doctor = doctors.find(d => d.id === id);
        return doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Not Selected';
    };
    const findServiceNameById = (id) => services.find(s => s.id === id)?.research_name || 'Not Selected';
    const findFunderNameById = (id) => {
        if (id === null) return 'Patient Self-Funded';
        return finances.find(f => f.id === id)?.funder_name || 'Not Selected';
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Anex for {patient.first_name} {patient.last_name}</h2>
                <form onSubmit={handleSubmit}>
                    <table className="anex-table">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Research</th>
                                <th>Funder</th>
                                <th style={{width: '130px'}}>Payable</th>
                                <th style={{width: '130px'}}>Paid</th>
                                <th style={{width: '180px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec, index) => (
                                <tr key={rec.id || `new-${index}`}>
                                    {editingRowIndex === index ? (
                                        <>
                                            <td>
                                                <select value={rec.doctor_id} onChange={e => handleRecordChange(index, 'doctor_id', parseInt(e.target.value))} required>
                                                    <option value="">Select Doctor</option>
                                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={rec.service_id} onChange={e => handleRecordChange(index, 'service_id', parseInt(e.target.value))} required>
                                                    <option value="">Select Research</option>
                                                    {services.map(s => <option key={s.id} value={s.id}>{s.research_name}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={rec.finance_id === null ? 'self' : rec.finance_id} onChange={e => handleRecordChange(index, 'finance_id', e.target.value === 'self' ? null : parseInt(e.target.value))}>
                                                    <option value="self">Patient Self-Funded</option>
                                                    {finances.map(f => <option key={f.id} value={f.id}>{f.funder_name}</option>)}
                                                </select>
                                            </td>
                                            <td><input className="amount-payable" type="number" step="0.01" value={rec.payable_amount} onChange={e => handleRecordChange(index, 'payable_amount', parseFloat(e.target.value) || 0)} /></td>
                                            <td><input className="amount-paid" type="number" step="0.01" value={rec.paid_amount} onChange={e => handleRecordChange(index, 'paid_amount', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="actions">
                                                <button type="button" className="btn btn-success btn-sm" onClick={() => handleApplyRowChanges(index)}>Apply</button>
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(index)}>Delete</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{findDoctorNameById(rec.doctor_id)}</td>
                                            <td>{findServiceNameById(rec.service_id)}</td>
                                            <td>{findFunderNameById(rec.finance_id)}</td>
                                            <td><span className="amount-payable">${rec.payable_amount.toFixed(2)}</span></td>
                                            <td><span className="amount-paid">${rec.paid_amount.toFixed(2)}</span></td>
                                            <td className="actions">
                                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEditClick(index)}>Edit</button>
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(index)}>Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button type="button" className="btn btn-secondary" style={{marginTop: '1rem'}} onClick={handleAddRecord} disabled={editingRowIndex !== null}>Add Record</button>
                    {apiError && <p className="error-message" style={{marginTop: '1.5rem'}}>{apiError}</p>}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Auth Components ---
const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
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
      localStorage.setItem('accessToken', response.data.access_token);
      onLoginSuccess();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
        <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
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
        if (!token) { setError("No registration token found in URL."); return; }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            await apiClient.post(`/users/?token=${token}`, formData);
            setSuccess("Registration successful! Your account is pending administrator approval. You may close this window.");
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (success) { return <div className="form-container"><p style={{color: 'var(--success-color)'}}>{success}</p></div> }

    return (
        <div className="form-container">
            <h2>Create Your Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
                <div className="form-group"><label>Username</label><input type="text" name="user_name" value={formData.user_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Password</label><input type="password" name="password" onChange={handleChange} required /></div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</button>
            </form>
        </div>
    );
};


// --- Page Views ---
const PatientsView = () => {
    const initialFilters = { personal_number: '', lastname: '', firstname: '', doctor: '', funder: '', research: '', staff: '' };
    const [patients, setPatients] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [anexPatient, setAnexPatient] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [allFinances, setAllFinances] = useState([]);
    const [apiError, setApiError] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    
    const doctors = useMemo(() => allUsers.filter(u => u.role === 'doctor' || u.role === 'admin'), [allUsers]);
    
    const fetchPatients = useCallback(async (currentFilters) => {
        try {
            setApiError('');
            // Remove empty keys from filters before sending
            const activeFilters = Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v !== ''));
            const patientsRes = await apiClient.get('/patients/', { params: activeFilters });
            setPatients(patientsRes.data);
        } catch(e) {
            console.error("Failed to fetch patients:", e);
            setApiError("Failed to load patients. Please try again later.");
        }
    }, []);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [servicesRes, financesRes, usersRes] = await Promise.all([
                    apiClient.get('/services/'),
                    apiClient.get('/finances/'),
                    apiClient.get('/admin/users/')
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
        fetchPatients(filters); // Initial patient load
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
            setApiError(error.response?.data?.detail || `Failed to save patient.`);
        }
    };
    
    const handleSaveAnex = async (patientId, records) => {
        try {
            setApiError('');
            await apiClient.put(`/patients/${patientId}/anex`, records);
            setAnexPatient(null);
            handleClearSearch();
        } catch (error) {
            setApiError(error.response?.data?.detail || 'Failed to save Anex details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Delete patient? This cannot be undone.`)) {
            try {
                setApiError('');
                await apiClient.delete(`/patients/${id}`);
                handleClearSearch();
            } catch (error) {
                alert(error.response?.data?.detail || "Failed to delete patient.");
            }
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
        {editingItem && <FormModal 
            title={editingItem.id ? "Edit Patient" : "Add Patient"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
        >
            <PatientFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}

        {anexPatient && <AnexModal 
            patient={anexPatient}
            doctors={doctors}
            services={allServices}
            finances={allFinances}
            onClose={() => setAnexPatient(null)}
            onSave={handleSaveAnex}
            apiError={apiError}
        />}

        <div className="page-header"><h2>Manage Patients</h2><button className="btn btn-primary" onClick={handleAddClick}>Add Patient</button></div>
        
        <div className="filter-container">
            <form onSubmit={handleSearch}>
                <div className="filter-grid">
                    <div className="filter-item"><label>Personal N</label><input type="text" name="personal_number" value={filters.personal_number} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Lastname</label><input type="text" name="lastname" value={filters.lastname} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Firstname</label><input type="text" name="firstname" value={filters.firstname} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Doctor</label><input type="text" name="doctor" value={filters.doctor} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Funder</label><input type="text" name="funder" value={filters.funder} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Research</label><input type="text" name="research" value={filters.research} onChange={handleFilterChange} /></div>
                    <div className="filter-item"><label>Staff</label><input type="text" name="staff" value={filters.staff} onChange={handleFilterChange} /></div>
                </div>
                <div className="filter-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>Clear</button>
                    <button type="submit" className="btn btn-primary">Search</button>
                </div>
            </form>
        </div>

        {apiError && !editingItem && !anexPatient && <p className="error-message">{apiError}</p>}
        <table>
            <thead><tr><th>Personal No.</th><th>Name</th><th>Birth Date</th><th>Assigned Staff</th><th>Actions</th></tr></thead>
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
                        <button className="btn btn-primary btn-sm" onClick={() => handleAnexClick(item)}>Anex</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                </tr>)}
            </tbody>
        </table>
    </div>);
};

const UsersView = () => {
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
            setApiError(error.response?.data?.detail || "Failed to save user.");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await apiClient.delete(`/admin/users/${userId}`);
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.detail || "Failed to delete user.");
            }
        }
    };

    const handleApprove = async (userId) => {
        try {
            const role = approvalRoles[userId] || 'staff'; // Default to staff if not selected
            await apiClient.post(`/admin/users/${userId}/approve`, { role });
            fetchUsers();
        } catch(error) {
            alert(error.response?.data?.detail || "Failed to approve user.");
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

    return (<div>
        {editingUser && <FormModal 
            title={editingUser.id ? "Edit User" : "Add User"} 
            onClose={() => setEditingUser(null)} 
            onSubmit={(e) => { e.preventDefault(); handleSave(editingUser); }}
            apiError={apiError}
        >
            <UserFormFields formData={editingUser} handleChange={handleFormChange} />
        </FormModal>}
        
        {isInvitationModalOpen && <InvitationModal onClose={() => setIsInvitationModalOpen(false)} />}
        
        <div className="page-header">
            <h2>Manage Users</h2>
            <div className="action-group" style={{display: 'flex', gap: '1rem'}}>
                <button className="btn btn-secondary" onClick={() => setIsInvitationModalOpen(true)}>Generate Invitation</button>
                <button className="btn btn-primary" onClick={handleAddClick}>Add User Manually</button>
            </div>
        </div>
        <table><thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {users.map(user => (<tr key={user.id}>
                <td>{user.first_name} {user.last_name}</td><td>{user.email}</td><td>{user.user_name}</td>
                <td>{user.role}</td>
                <td><span className={`status-badge ${user.is_approved ? 'status-approved' : 'status-pending'}`}>{user.is_approved ? 'Approved' : 'Pending'}</span></td>
                <td className="actions">
                    {!user.is_approved ? (
                        <>
                            <select 
                                value={approvalRoles[user.id] || 'staff'} 
                                onChange={(e) => setApprovalRoles(prev => ({...prev, [user.id]: e.target.value}))}
                                style={{width: '100px', marginRight: '0.5rem'}}
                            >
                                <option value="staff">Staff</option>
                                <option value="doctor">Doctor</option>
                            </select>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(user.id)}>Approve</button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(user)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Delete</button>
                        </>
                    )}
                </td>
            </tr>))}
        </tbody></table>
    </div>);
};

const FinanceView = () => {
    const [finances, setFinances] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [apiError, setApiError] = useState('');

    const fetchItems = useCallback(async () => { try { setFinances((await apiClient.get('/finances/')).data); } catch(e) { console.error("Failed to fetch finances:", e) } }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/finances/${formData.id}` : '/finances/';
        try {
            await apiClient[method](url, formData);
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            setApiError(error.response?.data?.detail || "Failed to save finance record.");
        }
    };
    
    const handleDelete = async (id) => { 
        if (window.confirm("Delete this finance record?")) { 
            try {
                await apiClient.delete(`/finances/${id}`); 
                fetchItems(); 
            } catch(error) {
                alert(error.response?.data?.detail || "Failed to delete record.");
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
            title={editingItem.id ? "Edit Finance Record" : "Add Finance Record"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
        >
            <FinanceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>Manage Finance</h2><button className="btn btn-primary" onClick={handleAddClick}>Add Record</button></div>
        <table><thead><tr><th>Funder</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead><tbody>
            {finances.map(item => <tr key={item.id}><td>{item.funder_name}</td><td>{item.email}</td><td>{item.phone_number}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
            </td></tr>)}
        </tbody></table>
    </div>);
};

const ServicesView = () => {
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
            setApiError(error.response?.data?.detail || "Failed to save service record.");
        }
    };
    const handleDelete = async (id) => { 
        if (window.confirm("Delete this service record?")) { 
            try {
                await apiClient.delete(`/services/${id}`); 
                fetchItems();
            } catch (error) {
                alert(error.response?.data?.detail || "Failed to delete record.");
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
            title={editingItem.id ? "Edit Service Record" : "Add Service Record"} 
            onClose={() => setEditingItem(null)} 
            onSubmit={e => { e.preventDefault(); handleSave(editingItem); }}
            apiError={apiError}
            >
            <ServiceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>Manage Services</h2><button className="btn btn-primary" onClick={handleAddClick}>Add Record</button></div>
        <table><thead><tr><th>Service No.</th><th>Research Name</th><th>Lab Name</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>
            {services.map(item => <tr key={item.id}><td>{item.service_number}</td><td>{item.research_name}</td><td>{item.laboratory_name}</td><td>{item.deadline}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
            </td></tr>)}
        </tbody></table>
    </div>);
};

// --- Main Components ---
const AdminDashboard = ({ handleLogout }) => {
    const [activeView, setActiveView] = useState('patients');
    const NavTab = ({ view, label }) => (<div className={`nav-tab ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}>{label}</div>);
    
    return ( 
        <div className="container">
            <div className="page-header"><h1>Admin Panel</h1><button className="btn btn-secondary" onClick={handleLogout}>Logout</button></div>
            <nav className="nav-tabs">
                <NavTab view="patients" label="Patients" />
                <NavTab view="users" label="Users" />
                <NavTab view="finance" label="Finance" />
                <NavTab view="services" label="Services" />
            </nav>
            {activeView === 'patients' && <PatientsView />}
            {activeView === 'users' && <UsersView />}
            {activeView === 'finance' && <FinanceView />}
            {activeView === 'services' && <ServicesView />}
        </div> 
    );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = (navigate) => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    navigate('/login');
  };
  
  const ProtectedRoute = ({ children }) => { 
    const navigate = useNavigate(); 
    useEffect(() => { 
        if (!loading && !isAuthenticated) {
            navigate('/login'); 
        }
    }, [isAuthenticated, loading, navigate]); 
    
    if (loading) {
        return null; // Or a loading spinner component
    }

    return isAuthenticated ? React.cloneElement(children, { handleLogout: () => handleLogout(navigate) }) : null; 
  };
  
  return ( 
    <> 
      <style>{styles}</style> 
      <BrowserRouter> 
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes> 
      </BrowserRouter> 
    </> 
  );
}

export default App;
