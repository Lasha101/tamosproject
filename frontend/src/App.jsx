// import React, { useState, useEffect, useCallback } from 'react';
// import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
// import axios from 'axios';

// // --- Configuration ---
// const API_BASE_URL = 'http://127.0.0.1:8000';
// const REGISTRATION_BASE_URL = 'http://localhost:5173/register';

// // --- Styles ---
// const styles = `
//   :root { --primary-color: #4a90e2; --secondary-color: #f5f7fa; --text-color: #333; --border-color: #e1e4e8; --danger-color: #d9534f; --success-color: #5cb85c; --pending-color: #f0ad4e; }
//   body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; background-color: var(--secondary-color); color: var(--text-color); }
//   .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
//   .form-container { max-width: 450px; margin: 5rem auto; padding: 2.5rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
//   h1, h2 { color: var(--primary-color); }
//   .form-group { margin-bottom: 1.5rem; text-align: left; }
//   label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }
//   input, select, textarea { width: 100%; padding: 0.8rem; border: 1px solid var(--border-color); border-radius: 6px; box-sizing: border-box; transition: all 0.2s; font-size: 1rem; }
//   select[multiple] { height: 120px; }
//   .btn { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
//   .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
//   table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
//   th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: top; }
//   .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
//   .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
//   .status-badge { padding: 0.25em 0.6em; font-size: 0.75rem; font-weight: 700; border-radius: 2em; text-transform: uppercase; }
//   .status-pending { background-color: var(--pending-color); color: white; } .status-approved { background-color: var(--success-color); color: white; }
//   .error-message { color: var(--danger-color); margin-top: 1rem; text-align:center; padding: 0.5rem; border-radius: 4px; background-color: rgba(217, 83, 79, 0.1); }
//   .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
//   .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 600px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
//   .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
//   .nav-tabs { display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 2rem; }
//   .nav-tab { padding: 1rem 1.5rem; cursor: pointer; font-weight: 600; color: #586069; border-bottom: 3px solid transparent; }
//   .nav-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
//   .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
//   .tag { background-color: #e1e4e8; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
//   .tag.tag-doctor { background-color: #cce5ff; color: #004085; }
//   .tag.tag-staff { background-color: #d4edda; color: #155724; }
//   .staff-list h4 { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555; }
// `;

// // --- API Client & Helper ---
// const apiClient = axios.create({ baseURL: API_BASE_URL });
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');
//   if (token) { config.headers.Authorization = `Bearer ${token}`; }
//   return config;
// }, (error) => Promise.reject(error));

// const FormModal = ({ title, children, onClose, onSubmit }) => (
//     <div className="modal-backdrop">
//         <div className="modal-content">
//             <h2>{title}</h2>
//             <form onSubmit={onSubmit}>
//                 {children}
//                 <div className="modal-footer">
//                     <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
//                     <button type="submit" className="btn btn-primary">Save</button>
//                 </div>
//             </form>
//         </div>
//     </div>
// );


// // --- Form Field Components ---
// const UserFormFields = ({ formData, handleChange }) => (<>
//     <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Username</label><input type="text" name="user_name" value={formData.user_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Password</label><input type="password" name="password" placeholder={formData.id ? "Leave blank to keep current" : ""} onChange={handleChange} required={!formData.id} /></div>
//     <div className="form-group">
//         <label>Role</label>
//         <select name="role" value={formData.role || 'staff'} onChange={handleChange}>
//             <option value="staff">Staff</option>
//             <option value="doctor">Doctor</option>
//         </select>
//     </div>
// </>);

// const FinanceFormFields = ({ formData, handleChange }) => (<>
//     <div className="form-group"><label>Funder Name</label><input type="text" name="funder_name" value={formData.funder_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Phone</label><input type="text" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} /></div>
//     <div className="form-group"><label>Paid Amount</label><input type="number" step="0.01" name="paid_amount" value={formData.paid_amount || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Payable Amount</label><input type="number" step="0.01" name="payable_amount" value={formData.payable_amount || ''} onChange={handleChange} required /></div>
// </>);

// const ServiceFormFields = ({ formData, handleChange }) => (<>
//     <div className="form-group"><label>Service Number</label><input type="text" name="service_number" value={formData.service_number || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Research Name</label><input type="text" name="research_name" value={formData.research_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Laboratory Name</label><input type="text" name="laboratory_name" value={formData.laboratory_name || ''} onChange={handleChange} required /></div>
//     <div className="form-group"><label>Deadline</label><input type="date" name="deadline" value={formData.deadline || ''} onChange={handleChange} /></div>
// </>);

// const PatientFormFields = ({ formData, handleChange, allServices, allFinances }) => (<>
//     <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
//     <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
//     <div className="form-group"><label>Birth Date</label><input type="date" name="birth_date" value={formData.birth_date || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
//     <div className="form-group"><label>Personal Number</label><input type="text" name="personal_number" value={formData.personal_number || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
//     <div className="form-group"><label>Nationality</label><input type="text" name="nationality" value={formData.nationality || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
//     <div className="form-group"><label>Address</label><input type="text" name="address" value={formData.address || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
//     <div className="form-group">
//         <label>Assign Services</label>
//         <select multiple name="service_ids" value={formData.service_ids || []} onChange={e => {
//             const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
//             handleChange('service_ids', selectedIds);
//         }}>
//             {allServices.map(s => <option key={s.id} value={s.id}>{s.service_number} - {s.research_name}</option>)}
//         </select>
//     </div>
//     <div className="form-group">
//         <label>Assign Finance Records</label>
//         <select multiple name="finance_ids" value={formData.finance_ids || []} onChange={e => {
//             const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
//             handleChange('finance_ids', selectedIds);
//         }}>
//             {allFinances.map(f => <option key={f.id} value={f.id}>{f.funder_name} (${f.payable_amount})</option>)}
//         </select>
//     </div>
// </>);

// // --- Auth Components ---
// const Login = ({ onLoginSuccess }) => {
//   const [username, setUsername] = useState('admin');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');
//     try {
//       const response = await apiClient.post('/token', new URLSearchParams({ username, password }));
//       localStorage.setItem('accessToken', response.data.access_token);
//       onLoginSuccess();
//       navigate('/');
//     } catch (err) {
//       setError(err.response?.data?.detail || "An error occurred during login.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="form-container">
//       <h1>Admin Login</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="form-group"><label>Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
//         <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
//         {error && <p className="error-message">{error}</p>}
//         <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
//       </form>
//     </div>
//   );
// };

// const Registration = () => {
//     const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', user_name: '', password: '' });
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [searchParams] = useSearchParams();
//     const token = searchParams.get('token');

//     const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!token) { setError("No registration token found in URL."); return; }
//         setIsLoading(true);
//         setError('');
//         setSuccess('');
//         try {
//             await apiClient.post(`/users/?token=${token}`, formData);
//             setSuccess("Registration successful! Your account is pending administrator approval. You may close this window.");
//         } catch (err) {
//             setError(err.response?.data?.detail || "Registration failed.");
//         } finally {
//             setIsLoading(false);
//         }
//     };
    
//     if (success) { return <div className="form-container"><p className="success-message">{success}</p></div> }

//     return (
//         <div className="form-container">
//             <h2>Create Your Account</h2>
//             <form onSubmit={handleSubmit}>
//                 <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
//                 <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
//                 <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
//                 <div className="form-group"><label>Username</label><input type="text" name="user_name" value={formData.user_name} onChange={handleChange} required /></div>
//                 <div className="form-group"><label>Password</label><input type="password" name="password" onChange={handleChange} required /></div>
//                 {error && <p className="error-message">{error}</p>}
//                 <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Registering...' : 'Register'}</button>
//             </form>
//         </div>
//     );
// };


// // --- Page Views ---
// const PatientsView = () => {
//     const [patients, setPatients] = useState([]);
//     const [editingItem, setEditingItem] = useState(null);
//     const [allServices, setAllServices] = useState([]);
//     const [allFinances, setAllFinances] = useState([]);
    
//     const fetchItems = useCallback(async () => { 
//         try { 
//             const [patientsRes, servicesRes, financesRes] = await Promise.all([
//                 apiClient.get('/patients/'),
//                 apiClient.get('/services/'),
//                 apiClient.get('/finances/')
//             ]);
//             setPatients(patientsRes.data);
//             setAllServices(servicesRes.data);
//             setAllFinances(financesRes.data);
//         } catch(e) { console.error("Failed to fetch data:", e) } 
//     }, []);

//     useEffect(() => { fetchItems(); }, [fetchItems]);

//     const handleSave = async (formData) => {
//         const method = formData.id ? 'put' : 'post';
//         const url = formData.id ? `/patients/${formData.id}` : '/patients/';
//         await apiClient[method](url, formData);
//         fetchItems();
//     };

//     const handleDelete = async (id) => {
//         if (window.confirm(`Delete patient? This cannot be undone.`)) {
//             await apiClient.delete(`/patients/${id}`);
//             fetchItems();
//         }
//     };
    
//     const handleEditClick = (item) => {
//         setEditingItem({
//             ...item,
//             service_ids: item.services.map(s => s.id),
//             finance_ids: item.finances.map(f => f.id)
//         });
//     };
    
//     const handleFormChange = (name, value) => {
//         setEditingItem(prev => ({ ...prev, [name]: value }));
//     };

//     return (<div>
//         {editingItem && <FormModal title={editingItem.id ? "Edit Patient" : "Add Patient"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
//             <PatientFormFields formData={editingItem} handleChange={handleFormChange} allServices={allServices} allFinances={allFinances} />
//         </FormModal>}

//         <div className="page-header"><h2>Manage Patients</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Patient</button></div>
        
//         <table>
//             <thead><tr><th>Personal No.</th><th>Name</th><th>Birth Date</th><th>Doctors</th><th>Staff</th><th>Services</th><th>Finances</th><th>Actions</th></tr></thead>
//             <tbody>
//                 {patients.map(item => <tr key={item.id}>
//                     <td>{item.personal_number}</td>
//                     <td>{item.first_name} {item.last_name}</td>
//                     <td>{item.birth_date}</td>
//                     <td>
//                         <div className="tag-list">
//                             {item.users
//                                 .filter(u => u.role === 'doctor' || u.role === 'admin')
//                                 .map(u => <span key={u.id} className="tag tag-doctor">{u.user_name}</span>)
//                             }
//                         </div>
//                     </td>
//                     <td>
//                         <div className="tag-list">
//                             {item.users
//                                 .filter(u => u.role === 'staff')
//                                 .map(u => <span key={u.id} className="tag tag-staff">{u.user_name}</span>)
//                             }
//                         </div>
//                     </td>
//                     <td><div className="tag-list">{item.services.map(s => <span key={s.id} className="tag">{s.service_number}</span>)}</div></td>
//                     <td><div className="tag-list">{item.finances.map(f => <span key={f.id} className="tag">{f.funder_name}</span>)}</div></td>
//                     <td className="actions">
//                         <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(item)}>Edit</button>
//                         <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
//                     </td>
//                 </tr>)}
//             </tbody>
//         </table>
//     </div>);
// };

// const UsersView = () => {
//     const [users, setUsers] = useState([]);
//     const [editingUser, setEditingUser] = useState(null);
//     const [approvalRoles, setApprovalRoles] = useState({});
    
//     const fetchUsers = useCallback(async () => { try { setUsers((await apiClient.get('/admin/users/')).data); } catch (e) { console.error("Failed to fetch users:", e); } }, []);
//     useEffect(() => { fetchUsers(); }, [fetchUsers]);

//     const handleSave = async (formData) => {
//         const data = {...formData};
//         if (editingUser.id && !data.password) delete data.password;
//         const method = editingUser.id ? 'put' : 'post';
//         const url = editingUser.id ? `/admin/users/${editingUser.id}` : '/admin/users/';
//         await apiClient[method](url, data);
//         fetchUsers();
//     };

//     const handleDelete = async (userId) => {
//         if (window.confirm("Are you sure you want to delete this user?")) {
//             await apiClient.delete(`/admin/users/${userId}`);
//             fetchUsers();
//         }
//     };

//     const handleApprove = async (userId) => {
//         const role = approvalRoles[userId] || 'staff'; // Default to staff if not selected
//         await apiClient.post(`/admin/users/${userId}/approve`, { role });
//         fetchUsers();
//     };
    
//     const handleFormChange = (e) => {
//         setEditingUser(prev => ({...prev, [e.target.name]: e.target.value}));
//     };

//     return (<div>
//         {editingUser && <FormModal title={editingUser.id ? "Edit User" : "Add User"} onClose={() => setEditingUser(null)} onSubmit={async (e) => { e.preventDefault(); await handleSave(editingUser); setEditingUser(null); }}>
//             <UserFormFields formData={editingUser} handleChange={handleFormChange} />
//         </FormModal>}
        
//         <div className="page-header"><h2>Manage Users</h2><div className="action-group">
//             <button className="btn btn-primary" onClick={() => setEditingUser({ role: 'staff' })}>Add User Manually</button>
//         </div></div>
//         <table><thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>
//             {users.map(user => (<tr key={user.id}>
//                 <td>{user.first_name} {user.last_name}</td><td>{user.email}</td><td>{user.user_name}</td>
//                 <td>{user.role}</td>
//                 <td><span className={`status-badge ${user.is_approved ? 'status-approved' : 'status-pending'}`}>{user.is_approved ? 'Approved' : 'Pending'}</span></td>
//                 <td className="actions">
//                     {!user.is_approved ? (
//                         <>
//                             <select 
//                                 value={approvalRoles[user.id] || 'staff'} 
//                                 onChange={(e) => setApprovalRoles(prev => ({...prev, [user.id]: e.target.value}))}
//                                 style={{width: '100px', marginRight: '0.5rem'}}
//                             >
//                                 <option value="staff">Staff</option>
//                                 <option value="doctor">Doctor</option>
//                             </select>
//                             <button className="btn btn-success btn-sm" onClick={() => handleApprove(user.id)}>Approve</button>
//                         </>
//                     ) : (
//                       <>
//                         <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(user)}>Edit</button>
//                         <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Delete</button>
//                       </>
//                     )}
//                 </td>
//             </tr>))}
//         </tbody></table>
//     </div>);
// };

// const FinanceView = () => {
//     const [finances, setFinances] = useState([]);
//     const [editingItem, setEditingItem] = useState(null);
    
//     const fetchItems = useCallback(async () => { try { setFinances((await apiClient.get('/finances/')).data); } catch(e) { console.error("Failed to fetch finances:", e) } }, []);
//     useEffect(() => { fetchItems(); }, [fetchItems]);

//     const handleSave = async (formData) => {
//         const method = formData.id ? 'put' : 'post';
//         const url = formData.id ? `/finances/${formData.id}` : '/finances/';
//         await apiClient[method](url, formData);
//         fetchItems();
//     };
    
//     const handleDelete = async (id) => { if (window.confirm("Delete this finance record?")) { await apiClient.delete(`/finances/${id}`); fetchItems(); } };
    
//     const handleFormChange = (e) => {
//         setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
//     };

//     return (<div>
//         {editingItem && <FormModal title={editingItem.id ? "Edit Finance Record" : "Add Finance Record"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
//             <FinanceFormFields formData={editingItem} handleChange={handleFormChange} />
//         </FormModal>}
//         <div className="page-header"><h2>Manage Finance</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Record</button></div>
//         <table><thead><tr><th>Funder</th><th>Email</th><th>Phone</th><th>Paid</th><th>Payable</th><th>Actions</th></tr></thead><tbody>
//             {finances.map(item => <tr key={item.id}><td>{item.funder_name}</td><td>{item.email}</td><td>{item.phone_number}</td><td>${item.paid_amount.toFixed(2)}</td><td>${item.payable_amount.toFixed(2)}</td><td className="actions">
//                 <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(item)}>Edit</button>
//                 <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
//             </td></tr>)}
//         </tbody></table>
//     </div>);
// };

// const ServicesView = () => {
//     const [services, setServices] = useState([]);
//     const [editingItem, setEditingItem] = useState(null);

//     const fetchItems = useCallback(async () => { try { setServices((await apiClient.get('/services/')).data); } catch(e) { console.error("Failed to fetch services:", e) } }, []);
//     useEffect(() => { fetchItems(); }, [fetchItems]);

//     const handleSave = async (formData) => {
//         const method = formData.id ? 'put' : 'post';
//         const url = formData.id ? `/services/${formData.id}` : '/services/';
//         await apiClient[method](url, formData);
//         fetchItems();
//     };
//     const handleDelete = async (id) => { if (window.confirm("Delete this service record?")) { await apiClient.delete(`/services/${id}`); fetchItems(); } };

//     const handleFormChange = (e) => {
//         setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
//     };

//     return (<div>
//         {editingItem && <FormModal title={editingItem.id ? "Edit Service Record" : "Add Service Record"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
//             <ServiceFormFields formData={editingItem} handleChange={handleFormChange} />
//         </FormModal>}
//         <div className="page-header"><h2>Manage Services</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Record</button></div>
//         <table><thead><tr><th>Service No.</th><th>Research Name</th><th>Lab Name</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>
//             {services.map(item => <tr key={item.id}><td>{item.service_number}</td><td>{item.research_name}</td><td>{item.laboratory_name}</td><td>{item.deadline}</td><td className="actions">
//                 <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(item)}>Edit</button>
//                 <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
//             </td></tr>)}
//         </tbody></table>
//     </div>);
// };

// // --- Main Components ---
// const AdminDashboard = () => {
//     const [activeView, setActiveView] = useState('patients');
//     const navigate = useNavigate();
//     const NavTab = ({ view, label }) => (<div className={`nav-tab ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}>{label}</div>);
    
//     const handleLogout = () => {
//         localStorage.removeItem('accessToken');
//         navigate('/login');
//     };
    
//     return ( 
//         <div className="container">
//             <div className="page-header"><h1>Admin Panel</h1><button className="btn" onClick={handleLogout}>Logout</button></div>
//             <nav className="nav-tabs">
//                 <NavTab view="patients" label="Patients" />
//                 <NavTab view="users" label="Users" />
//                 <NavTab view="finance" label="Finance" />
//                 <NavTab view="services" label="Services" />
//             </nav>
//             {activeView === 'patients' && <PatientsView />}
//             {activeView === 'users' && <UsersView />}
//             {activeView === 'finance' && <FinanceView />}
//             {activeView === 'services' && <ServicesView />}
//         </div> 
//     );
// };

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  
//   const handleLoginSuccess = () => {
//     setIsAuthenticated(true);
//   };
  
//   const ProtectedRoute = ({ children }) => { 
//     const navigate = useNavigate(); 
//     useEffect(() => { 
//         if (!isAuthenticated) {
//             navigate('/login'); 
//         }
//     }, [isAuthenticated, navigate]); 
//     return isAuthenticated ? children : null; 
//   };
  
//   return ( 
//     <> 
//       <style>{styles}</style> 
//       <BrowserRouter> 
//         <Routes>
//           <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
//           <Route path="/register" element={<Registration />} />
//           <Route path="/" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
//         </Routes> 
//       </BrowserRouter> 
//     </> 
//   );
// }

// export default App;




import React, { useState, useEffect, useCallback } from 'react';
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
  .btn { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.875rem; }
  .btn-secondary { background-color: #6c757d; color: white; }
  .btn-secondary:hover { background-color: #5a6268; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: top; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .status-badge { padding: 0.25em 0.6em; font-size: 0.75rem; font-weight: 700; border-radius: 2em; text-transform: uppercase; }
  .status-pending { background-color: var(--pending-color); color: white; } .status-approved { background-color: var(--success-color); color: white; }
  .error-message { color: var(--danger-color); margin-top: 1rem; text-align:center; padding: 0.5rem; border-radius: 4px; background-color: rgba(217, 83, 79, 0.1); }
  .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 600px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
  .nav-tabs { display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 2rem; }
  .nav-tab { padding: 1rem 1.5rem; cursor: pointer; font-weight: 600; color: #586069; border-bottom: 3px solid transparent; }
  .nav-tab.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .tag { background-color: #e1e4e8; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
  .tag.tag-doctor { background-color: #cce5ff; color: #004085; }
  .tag.tag-staff { background-color: #d4edda; color: #155724; }
  .staff-list h4 { margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #555; }
  .invitation-link-container { margin-top: 1.5rem; padding: 1rem; background-color: var(--secondary-color); border: 1px dashed var(--border-color); border-radius: 4px; word-break: break-all; }
`;

// --- API Client & Helper ---
const apiClient = axios.create({ baseURL: API_BASE_URL });
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
}, (error) => Promise.reject(error));

const FormModal = ({ title, children, onClose, onSubmit }) => (
    <div className="modal-backdrop">
        <div className="modal-content">
            <h2>{title}</h2>
            <form onSubmit={onSubmit}>
                {children}
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
    <div className="form-group"><label>Paid Amount</label><input type="number" step="0.01" name="paid_amount" value={formData.paid_amount || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Payable Amount</label><input type="number" step="0.01" name="payable_amount" value={formData.payable_amount || ''} onChange={handleChange} required /></div>
</>);

const ServiceFormFields = ({ formData, handleChange }) => (<>
    <div className="form-group"><label>Service Number</label><input type="text" name="service_number" value={formData.service_number || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Research Name</label><input type="text" name="research_name" value={formData.research_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Laboratory Name</label><input type="text" name="laboratory_name" value={formData.laboratory_name || ''} onChange={handleChange} required /></div>
    <div className="form-group"><label>Deadline</label><input type="date" name="deadline" value={formData.deadline || ''} onChange={handleChange} /></div>
</>);

const PatientFormFields = ({ formData, handleChange, allServices, allFinances }) => (<>
    <div className="form-group"><label>First Name</label><input type="text" name="first_name" value={formData.first_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Last Name</label><input type="text" name="last_name" value={formData.last_name || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Birth Date</label><input type="date" name="birth_date" value={formData.birth_date || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Personal Number</label><input type="text" name="personal_number" value={formData.personal_number || ''} onChange={e => handleChange(e.target.name, e.target.value)} required /></div>
    <div className="form-group"><label>Nationality</label><input type="text" name="nationality" value={formData.nationality || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
    <div className="form-group"><label>Address</label><input type="text" name="address" value={formData.address || ''} onChange={e => handleChange(e.target.name, e.target.value)} /></div>
    <div className="form-group">
        <label>Assign Services</label>
        <select multiple name="service_ids" value={formData.service_ids || []} onChange={e => {
            const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
            handleChange('service_ids', selectedIds);
        }}>
            {allServices.map(s => <option key={s.id} value={s.id}>{s.service_number} - {s.research_name}</option>)}
        </select>
    </div>
    <div className="form-group">
        <label>Assign Finance Records</label>
        <select multiple name="finance_ids" value={formData.finance_ids || []} onChange={e => {
            const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
            handleChange('finance_ids', selectedIds);
        }}>
            {allFinances.map(f => <option key={f.id} value={f.id}>{f.funder_name} (${f.payable_amount})</option>)}
        </select>
    </div>
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
            <div className="modal-content">
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
    
    if (success) { return <div className="form-container"><p className="success-message">{success}</p></div> }

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
    const [patients, setPatients] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [allFinances, setAllFinances] = useState([]);
    
    const fetchItems = useCallback(async () => { 
        try { 
            const [patientsRes, servicesRes, financesRes] = await Promise.all([
                apiClient.get('/patients/'),
                apiClient.get('/services/'),
                apiClient.get('/finances/')
            ]);
            setPatients(patientsRes.data);
            setAllServices(servicesRes.data);
            setAllFinances(financesRes.data);
        } catch(e) { console.error("Failed to fetch data:", e) } 
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/patients/${formData.id}` : '/patients/';
        await apiClient[method](url, formData);
        fetchItems();
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Delete patient? This cannot be undone.`)) {
            await apiClient.delete(`/patients/${id}`);
            fetchItems();
        }
    };
    
    const handleEditClick = (item) => {
        setEditingItem({
            ...item,
            service_ids: item.services.map(s => s.id),
            finance_ids: item.finances.map(f => f.id)
        });
    };
    
    const handleFormChange = (name, value) => {
        setEditingItem(prev => ({ ...prev, [name]: value }));
    };

    return (<div>
        {editingItem && <FormModal title={editingItem.id ? "Edit Patient" : "Add Patient"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
            <PatientFormFields formData={editingItem} handleChange={handleFormChange} allServices={allServices} allFinances={allFinances} />
        </FormModal>}

        <div className="page-header"><h2>Manage Patients</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Patient</button></div>
        
        <table>
            <thead><tr><th>Personal No.</th><th>Name</th><th>Birth Date</th><th>Doctors</th><th>Staff</th><th>Services</th><th>Finances</th><th>Actions</th></tr></thead>
            <tbody>
                {patients.map(item => <tr key={item.id}>
                    <td>{item.personal_number}</td>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.birth_date}</td>
                    <td>
                        <div className="tag-list">
                            {item.users
                                .filter(u => u.role === 'doctor' || u.role === 'admin')
                                .map(u => <span key={u.id} className="tag tag-doctor">{u.user_name}</span>)
                            }
                        </div>
                    </td>
                    <td>
                        <div className="tag-list">
                            {item.users
                                .filter(u => u.role === 'staff')
                                .map(u => <span key={u.id} className="tag tag-staff">{u.user_name}</span>)
                            }
                        </div>
                    </td>
                    <td><div className="tag-list">{item.services.map(s => <span key={s.id} className="tag">{s.service_number}</span>)}</div></td>
                    <td><div className="tag-list">{item.finances.map(f => <span key={f.id} className="tag">{f.funder_name}</span>)}</div></td>
                    <td className="actions">
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
    
    const fetchUsers = useCallback(async () => { try { setUsers((await apiClient.get('/admin/users/')).data); } catch (e) { console.error("Failed to fetch users:", e); } }, []);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSave = async (formData) => {
        const data = {...formData};
        if (editingUser.id && !data.password) delete data.password;
        const method = editingUser.id ? 'put' : 'post';
        const url = editingUser.id ? `/admin/users/${editingUser.id}` : '/admin/users/';
        await apiClient[method](url, data);
        fetchUsers();
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            await apiClient.delete(`/admin/users/${userId}`);
            fetchUsers();
        }
    };

    const handleApprove = async (userId) => {
        const role = approvalRoles[userId] || 'staff'; // Default to staff if not selected
        await apiClient.post(`/admin/users/${userId}/approve`, { role });
        fetchUsers();
    };
    
    const handleFormChange = (e) => {
        setEditingUser(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    return (<div>
        {editingUser && <FormModal title={editingUser.id ? "Edit User" : "Add User"} onClose={() => setEditingUser(null)} onSubmit={async (e) => { e.preventDefault(); await handleSave(editingUser); setEditingUser(null); }}>
            <UserFormFields formData={editingUser} handleChange={handleFormChange} />
        </FormModal>}
        
        {isInvitationModalOpen && <InvitationModal onClose={() => setIsInvitationModalOpen(false)} />}
        
        <div className="page-header">
            <h2>Manage Users</h2>
            <div className="action-group" style={{display: 'flex', gap: '1rem'}}>
                <button className="btn btn-secondary" onClick={() => setIsInvitationModalOpen(true)}>Generate Invitation</button>
                <button className="btn btn-primary" onClick={() => setEditingUser({ role: 'staff' })}>Add User Manually</button>
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
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser(user)}>Edit</button>
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
    
    const fetchItems = useCallback(async () => { try { setFinances((await apiClient.get('/finances/')).data); } catch(e) { console.error("Failed to fetch finances:", e) } }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/finances/${formData.id}` : '/finances/';
        await apiClient[method](url, formData);
        fetchItems();
    };
    
    const handleDelete = async (id) => { if (window.confirm("Delete this finance record?")) { await apiClient.delete(`/finances/${id}`); fetchItems(); } };
    
    const handleFormChange = (e) => {
        setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    return (<div>
        {editingItem && <FormModal title={editingItem.id ? "Edit Finance Record" : "Add Finance Record"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
            <FinanceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>Manage Finance</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Record</button></div>
        <table><thead><tr><th>Funder</th><th>Email</th><th>Phone</th><th>Paid</th><th>Payable</th><th>Actions</th></tr></thead><tbody>
            {finances.map(item => <tr key={item.id}><td>{item.funder_name}</td><td>{item.email}</td><td>{item.phone_number}</td><td>${item.paid_amount.toFixed(2)}</td><td>${item.payable_amount.toFixed(2)}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
            </td></tr>)}
        </tbody></table>
    </div>);
};

const ServicesView = () => {
    const [services, setServices] = useState([]);
    const [editingItem, setEditingItem] = useState(null);

    const fetchItems = useCallback(async () => { try { setServices((await apiClient.get('/services/')).data); } catch(e) { console.error("Failed to fetch services:", e) } }, []);
    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSave = async (formData) => {
        const method = formData.id ? 'put' : 'post';
        const url = formData.id ? `/services/${formData.id}` : '/services/';
        await apiClient[method](url, formData);
        fetchItems();
    };
    const handleDelete = async (id) => { if (window.confirm("Delete this service record?")) { await apiClient.delete(`/services/${id}`); fetchItems(); } };

    const handleFormChange = (e) => {
        setEditingItem(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    return (<div>
        {editingItem && <FormModal title={editingItem.id ? "Edit Service Record" : "Add Service Record"} onClose={() => setEditingItem(null)} onSubmit={async e => { e.preventDefault(); await handleSave(editingItem); setEditingItem(null); }}>
            <ServiceFormFields formData={editingItem} handleChange={handleFormChange} />
        </FormModal>}
        <div className="page-header"><h2>Manage Services</h2><button className="btn btn-primary" onClick={() => setEditingItem({})}>Add Record</button></div>
        <table><thead><tr><th>Service No.</th><th>Research Name</th><th>Lab Name</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>
            {services.map(item => <tr key={item.id}><td>{item.service_number}</td><td>{item.research_name}</td><td>{item.laboratory_name}</td><td>{item.deadline}</td><td className="actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
            </td></tr>)}
        </tbody></table>
    </div>);
};

// --- Main Components ---
const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('patients');
    const navigate = useNavigate();
    const NavTab = ({ view, label }) => (<div className={`nav-tab ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}>{label}</div>);
    
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    };
    
    return ( 
        <div className="container">
            <div className="page-header"><h1>Admin Panel</h1><button className="btn" onClick={handleLogout}>Logout</button></div>
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
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };
  
  const ProtectedRoute = ({ children }) => { 
    const navigate = useNavigate(); 
    useEffect(() => { 
        if (!isAuthenticated) {
            navigate('/login'); 
        }
    }, [isAuthenticated, navigate]); 
    return isAuthenticated ? children : null; 
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

