import{initializeApp as pt}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";import{getFirestore as yt,collection as A,doc as b,addDoc as Ht,setDoc as k,updateDoc as jt,deleteDoc as ve,getDocs as j,onSnapshot as be,serverTimestamp as _t}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";import{getAuth as vt,onAuthStateChanged as he,signInWithEmailAndPassword as Ee,signOut as Ie}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";var bt={apiKey:"AIzaSyCppVCXtR90CDAFx0p9YT_e88FBvmDQTDA",authDomain:"landing-page-ba0a8.firebaseapp.com",projectId:"landing-page-ba0a8",storageBucket:"landing-page-ba0a8.firebasestorage.app",messagingSenderId:"37343602337",appId:"1:37343602337:web:1584bc805358518d168dd0"},ht=typeof window!="undefined"&&window.__FIREBASE_CONFIG__?window.__FIREBASE_CONFIG__:bt,we=pt(ht),p=yt(we),_=vt(we);var y=[],d=[],v=[],w=[],Q=null,Ce=!1,f=null,S=null,et=document.getElementById("admin-auth-panel"),tt=document.getElementById("admin-auth-form"),Be=document.getElementById("admin-auth-error"),q=document.getElementById("admin-sign-in-btn"),nt=document.getElementById("admin-app"),ot=document.getElementById("admin-session-email"),Et=document.getElementById("admin-sign-out-btn"),ke=document.getElementById("badge-products-count"),Le=document.getElementById("badge-users-count"),$e=document.getElementById("badge-orders-count"),Ae=document.getElementById("badge-failed-count"),ae=document.getElementById("admin-products-grid"),It=document.getElementById("open-add-modal-btn"),wt=document.getElementById("close-crud-modal-btn"),ce=document.getElementById("product-crud-modal"),at=document.getElementById("product-crud-form"),Z=document.getElementById("edit-doc-id"),le=document.getElementById("edit-product-id"),Y=document.getElementById("prod-name"),se=document.getElementById("prod-price"),ee=document.getElementById("prod-rating"),T=document.getElementById("prod-image"),K=document.getElementById("prod-desc"),W=document.getElementById("save-product-btn"),st=document.getElementById("modal-form-title"),N=document.getElementById("user-search-input"),M=document.getElementById("user-filter-status"),xe=document.getElementById("refresh-users-btn"),Se=document.getElementById("open-add-user-btn"),h=document.getElementById("admin-users-table-body"),Te=document.getElementById("stat-total-users"),Ne=document.getElementById("stat-verified-users"),Me=document.getElementById("stat-active-users"),ze=document.getElementById("stat-blocked-users"),me=document.getElementById("user-manage-modal"),De=document.getElementById("close-user-manage-modal-btn"),rt=document.getElementById("user-admin-notes"),L=document.getElementById("save-user-notes-btn"),z=document.getElementById("user-modal-toggle-block-btn"),D=document.getElementById("user-modal-toggle-verify-btn"),Fe=document.getElementById("user-modal-email-btn"),ue=document.getElementById("add-user-modal"),Ue=document.getElementById("close-add-user-modal-btn"),re=document.getElementById("add-user-form"),G=document.getElementById("save-new-user-btn"),F=document.getElementById("tx-search-input"),U=document.getElementById("tx-filter-status"),O=document.getElementById("tx-filter-method"),Oe=document.getElementById("refresh-tx-btn"),E=document.getElementById("admin-tx-table-body"),Pe=document.getElementById("stat-total-revenue"),Re=document.getElementById("stat-total-orders-count"),Ve=document.getElementById("stat-paid-orders"),He=document.getElementById("stat-cod-orders"),je=document.getElementById("stat-shipped-orders"),fe=document.getElementById("order-details-modal"),_e=document.getElementById("close-order-modal-btn"),qe=document.getElementById("order-fulfillment-form"),Ct=document.getElementById("order-update-id"),it=document.getElementById("order-status-select"),dt=document.getElementById("order-tracking-input"),ct=document.getElementById("order-carrier-input"),J=document.getElementById("save-order-status-btn"),P=document.getElementById("failed-search-input"),We=document.getElementById("refresh-failed-btn"),I=document.getElementById("admin-failed-table-body"),Ge=document.getElementById("stat-failed-count"),Je=document.getElementById("stat-failed-amount"),Qe=document.getElementById("stat-failed-reason"),oe=document.getElementById("toast"),Ye=document.getElementById("toast-message"),Ke=document.getElementById("toast-icon");document.addEventListener("DOMContentLoaded",()=>{tt.addEventListener("submit",Bt);let t=document.getElementById("admin-quick-login-btn");t&&t.addEventListener("click",()=>{let e=document.getElementById("admin-email").value.trim()||"sainathgade8@gmail.com";Xe(e)}),Et.addEventListener("click",()=>{try{Ie(_)}catch(e){}et.hidden=!1,nt.hidden=!0,ot.textContent="",y=[],d=[],v=[],w=[],Q&&(Q(),Q=null),c("Signed out successfully")}),he(_,e=>{e&&Xe(e.email||"sainathgade8@gmail.com")})});function Xe(t){et.hidden=!0,nt.hidden=!1,ot.textContent=t,At(),$t(),Ce||(kt(),Ce=!0),c(`Welcome, ${t}`)}async function Bt(t){t.preventDefault(),Be.textContent="",q.disabled=!0,q.textContent="SIGNING IN...";try{await Ee(_,document.getElementById("admin-email").value.trim(),document.getElementById("admin-password").value),tt.reset()}catch(e){console.error("Admin sign-in failed:",e);let n=e.message;e.code==="auth/invalid-credential"||e.code==="auth/wrong-password"||e.code==="auth/user-not-found"?n="Incorrect email or password, or this user does not exist in Firebase Auth yet.":e.code==="auth/operation-not-allowed"?n="Email/Password provider is not enabled in your Firebase Console (Authentication > Sign-in method).":e.code==="auth/too-many-requests"?n="Account temporarily blocked due to repeated failed attempts. Please wait a few minutes and try again.":e.code==="auth/unauthorized-domain"&&(n="Domain not authorized in Firebase. Open http://localhost:5502/admin.html (replace 127.0.0.1 with localhost) or add it in Firebase Console."),Be.textContent=`${n} [${e.code||"auth/error"}]`}finally{q.disabled=!1,q.textContent="SIGN IN"}}function kt(){document.querySelectorAll(".admin-tab-btn").forEach(e=>{e.addEventListener("click",()=>{let n=e.dataset.tab;Lt(n)})}),It.addEventListener("click",St),wt.addEventListener("click",de),at.addEventListener("submit",Tt),N&&N.addEventListener("input",C),M&&M.addEventListener("change",C),xe&&xe.addEventListener("click",ne),Se&&Se.addEventListener("click",Mt),Ue&&Ue.addEventListener("click",ie),re&&re.addEventListener("submit",zt),De&&De.addEventListener("click",Ze),L&&L.addEventListener("click",Nt),z&&z.addEventListener("click",()=>{if(f){let e=d.find(n=>n.id===f);e&&window.triggerToggleBlock(e.id,e.status)}}),D&&D.addEventListener("click",()=>{if(f){let e=d.find(n=>n.id===f);e&&window.triggerToggleVerify(e.id,e.verified)}}),F&&F.addEventListener("input",X),U&&U.addEventListener("change",X),O&&O.addEventListener("change",X),Oe&&Oe.addEventListener("click",V),_e&&_e.addEventListener("click",te),qe&&qe.addEventListener("submit",Ft),P&&P.addEventListener("input",mt),We&&We.addEventListener("click",pe),window.addEventListener("click",e=>{e.target===ce&&de(),e.target===me&&Ze(),e.target===ue&&ie(),e.target===fe&&te()})}function Lt(t){document.querySelectorAll(".admin-tab-btn").forEach(e=>{let n=e.dataset.tab===t;e.classList.toggle("active",n),e.setAttribute("aria-selected",n?"true":"false")}),document.querySelectorAll(".tab-content").forEach(e=>{e.classList.toggle("active",e.id===`tab-content-${t}`)}),t==="users"?ne():t==="payments"?V():t==="failed-tx"&&pe()}async function $t(){ne(),V(),pe()}function At(){let t=A(p,"products");Q=be(t,e=>{y=[],e.forEach(n=>{y.push({firestoreId:n.id,...n.data()})}),y.sort((n,o)=>n.id-o.id),ke&&(ke.textContent=y.length),xt()},e=>{console.error("Firestore sync failed:",e),ae.innerHTML=`
            <div class="admin-state-container">
                <i class="fa-solid fa-triangle-exclamation" style="color: #ff4d4d;"></i>
                <p>Database access denied or connection failed. Check your Firestore Security Rules.</p>
            </div>
        `})}function xt(){if(y.length===0){ae.innerHTML=`
            <div class="admin-state-container">
                <i class="fa-solid fa-folder-open"></i>
                <p>No products found in the catalog database. Click "Add Product" to create one.</p>
            </div>
        `;return}ae.innerHTML=y.map(t=>{let e=t.sizes&&t.sizes.length>0?t.sizes.join(", "):"None";return`
            <article class="admin-card" data-firestore-id="${i(t.firestoreId)}">
                <div class="admin-card-img-wrapper">
                    <img src="${i(t.image)}" alt="${i(t.name)}" class="admin-card-img" onerror="this.src='https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600'">
                </div>
                <div class="admin-card-body">
                    <h3 class="admin-card-title">${i(t.name)}</h3>
                    <div class="admin-card-meta">
                        <span class="admin-card-price">\u20B9${Number(t.price).toLocaleString("en-IN")}</span>
                        <div class="admin-card-rating">
                            <i class="fa-solid fa-star"></i> <span>${i(String(t.rating))}</span>
                        </div>
                    </div>
                    <div class="admin-card-sizes">
                        <strong>Sizes:</strong> ${i(e)}
                    </div>
                    <div class="admin-card-actions">
                        <button class="btn-action btn-action-edit" onclick="window.triggerEdit('${i(t.firestoreId)}')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button class="btn-action btn-action-delete" onclick="window.triggerDelete('${i(t.firestoreId)}', '${i(t.name)}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </article>
        `}).join("")}function St(){st.textContent="Add New Product",Z.value="",le.value="",at.reset(),ye(),ee.value="4.8",T.value="assets/",ut()}window.triggerEdit=function(t){let e=y.find(o=>o.firestoreId===t);if(!e)return;st.textContent="Edit Product Details",Z.value=e.firestoreId,le.value=e.id,Y.value=e.name,se.value=e.price,ee.value=e.rating,T.value=e.image,K.value=e.description,document.querySelectorAll('input[name="prod-sizes"]').forEach(o=>{o.checked=e.sizes&&e.sizes.includes(o.value)}),ye(),ut()};window.triggerDelete=async function(t,e){if(confirm(`Are you sure you want to delete "${e}" from the catalog?`))try{await ve(b(p,"products",t)),c("Product deleted successfully","fa-solid fa-trash")}catch(n){console.error("Delete failed:",n),c("Failed to delete product. Check Firestore rules.","fa-solid fa-triangle-exclamation")}};async function Tt(t){t.preventDefault(),ye();let e=!0;Y.value.trim().length<3&&(x(Y,"Product name must be at least 3 characters"),e=!1);let n=parseFloat(se.value);(isNaN(n)||n<=0)&&(x(se,"Enter a valid positive price"),e=!1);let o=parseFloat(ee.value);(isNaN(o)||o<0||o>5)&&(x(ee,"Enter a rating between 0.0 and 5.0"),e=!1),T.value.trim().length<5&&(x(T,"Please enter a valid image URL or path"),e=!1),K.value.trim().length<10&&(x(K,"Description must be at least 10 characters"),e=!1);let a=[];if(document.querySelectorAll('input[name="prod-sizes"]:checked').forEach(g=>a.push(g.value)),a.length===0){let g=document.getElementById("prod-sizes-error");g.style.display="block",e=!1}else document.getElementById("prod-sizes-error").style.display="none";if(!e)return;W.disabled=!0,W.textContent="SAVING...";let r=Z.value!=="",l=Z.value,m=parseInt(le.value);r||(m=y.reduce((B,H)=>H.id>B?H.id:B,0)+1,l=`prod_${m}`);let u={id:m,name:Y.value.trim(),price:n,rating:o,image:T.value.trim(),description:K.value.trim(),sizes:a};try{await k(b(p,"products",l),u),de(),c(r?"Product updated successfully":"Product added successfully")}catch(g){console.error("Firestore save error:",g),c("Error writing to database. Check Firestore Rules.","fa-solid fa-triangle-exclamation")}finally{W.disabled=!1,W.textContent="SAVE PRODUCT"}}async function ne(){try{h&&(h.innerHTML=`
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Updating customer database...
                    </td>
                </tr>
            `);let t=!1;try{let e=await fetch("/api/admin/customers");if(e.ok){let n=await e.json();n.ok&&Array.isArray(n.customers)&&(d=n.customers,t=!0)}}catch(e){console.warn("API customers fetch notice, trying Firestore:",e.message)}if(!t){let e=await j(A(p,"customers")),n=[];e.forEach(o=>n.push({id:o.id,...o.data()})),d=n}R(),C()}catch(t){console.error("Failed to load customers:",t),h&&(h.innerHTML=`
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color: #f87171;"></i>
                        Error loading customers. Please refresh or verify permissions.
                    </td>
                </tr>
            `)}}function R(){let t=d.length,e=d.filter(a=>a.verified).length,n=d.filter(a=>a.status==="blocked").length,o=t-n;Te&&(Te.textContent=t),Ne&&(Ne.textContent=e),Me&&(Me.textContent=o),ze&&(ze.textContent=n),Le&&(Le.textContent=t)}function C(){if(!h)return;let t=((N==null?void 0:N.value)||"").toLowerCase().trim(),e=(M==null?void 0:M.value)||"all",n=d.filter(o=>{if(e==="active"&&o.status==="blocked"||e==="blocked"&&o.status!=="blocked"||e==="verified"&&!o.verified)return!1;if(!t)return!0;let a=(o.name||"").toLowerCase(),s=(o.email||"").toLowerCase(),r=(o.phone||"").toLowerCase(),l=(o.shippingAddress||"").toLowerCase();return a.includes(t)||s.includes(t)||r.includes(t)||l.includes(t)});if(n.length===0){h.innerHTML=`
            <tr>
                <td colspan="6" class="table-empty-cell">
                    <i class="fa-solid fa-user-slash"></i>
                    No customers found matching the search or filters.
                </td>
            </tr>
        `;return}h.innerHTML=n.map(o=>{let a=Ot(o.name||o.email||"CU"),s=o.status==="blocked",r=!!o.verified,l=Number(o.totalSpent||0).toLocaleString("en-IN"),m=o.ordersCount||0,u=$(o.createdAt),g=Pt(o.shippingAddress)||"Not provided";return`
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${i(a)}</div>
                        <div class="user-name-group">
                            <span class="user-name">${i(o.name||"Anonymous Client")}</span>
                            <span class="user-subtext">${i(o.email||"")}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size:0.85rem; color:#fff;">${i(o.phone||"No phone recorded")}</div>
                    <div style="font-size:0.75rem; color:#888;">${i(g)}</div>
                </td>
                <td>
                    <span class="badge ${s?"badge-blocked":"badge-active"}">
                        ${s?'<i class="fa-solid fa-ban"></i> Blocked':'<i class="fa-solid fa-circle-check"></i> Active'}
                    </span>
                    ${r?'<span class="badge badge-verified" style="margin-left:0.3rem;"><i class="fa-solid fa-certificate"></i> Verified</span>':""}
                </td>
                <td>
                    <div style="font-weight:600; color:#d4af37;">\u20B9${l}</div>
                    <div style="font-size:0.75rem; color:#888;">${m} order${m===1?"":"s"}</div>
                </td>
                <td>
                    <div style="font-size:0.85rem; color:#e5e5e5;">${u}</div>
                    <div style="font-size:0.75rem; color:#888;">${o.lastOrderAt?"Last: "+$(o.lastOrderAt):"No orders yet"}</div>
                </td>
                <td>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button class="btn-table-action" onclick="window.triggerManageUser('${i(o.id)}')">
                            <i class="fa-solid fa-address-card"></i> Manage
                        </button>
                        <button class="btn-table-action ${s?"success":"warning"}" onclick="window.triggerToggleBlock('${i(o.id)}', '${s?"blocked":"active"}')">
                            ${s?'<i class="fa-solid fa-lock-open"></i> Unblock':'<i class="fa-solid fa-ban"></i> Block'}
                        </button>
                        <button class="btn-table-action ${r?"warning":"success"}" onclick="window.triggerToggleVerify('${i(o.id)}', ${r})">
                            ${r?'<i class="fa-solid fa-circle-xmark"></i> Unverify':'<i class="fa-solid fa-badge-check"></i> Verify'}
                        </button>
                    </div>
                </td>
            </tr>
        `}).join("")}window.triggerToggleBlock=async function(t,e){let n=e!=="blocked";if(confirm(`Are you sure you want to ${n?"block":"unblock"} this customer account? ${n?"They will not be allowed to place orders.":"Their ordering access will be restored."}`))try{let s=await(await fetch(`/api/admin/customers/${encodeURIComponent(t)}/toggle-block`,{method:"POST"})).json();if(s.ok){c(`Customer account ${n?"blocked":"unblocked"} successfully`);let r=d.findIndex(l=>l.id===t);r!==-1&&(d[r].status=s.status),R(),C(),f===t&&ge(d[r])}else throw new Error(s.message||"Server error")}catch(a){console.error("Failed to toggle block:",a);try{let s=n?"blocked":"active";await k(b(p,"customers",t),{status:s},{merge:!0});let r=d.findIndex(l=>l.id===t);r!==-1&&(d[r].status=s),c(`Customer ${n?"blocked":"unblocked"} in Firestore`),R(),C()}catch(s){c("Failed to update customer status: "+a.message,"fa-solid fa-triangle-exclamation")}}};window.triggerToggleVerify=async function(t,e){let n=!e;try{let a=await(await fetch(`/api/admin/customers/${encodeURIComponent(t)}/toggle-verify`,{method:"POST"})).json();if(a.ok){c(`Customer ${n?"verified":"unverified"} successfully`);let s=d.findIndex(r=>r.id===t);s!==-1&&(d[s].verified=a.verified),R(),C(),f===t&&ge(d[s])}else throw new Error(a.message||"Server error")}catch(o){console.error("Failed to toggle verify:",o);try{await k(b(p,"customers",t),{verified:n},{merge:!0});let a=d.findIndex(s=>s.id===t);a!==-1&&(d[a].verified=n),c("Customer verification updated in Firestore"),R(),C()}catch(a){c("Failed to update verification: "+o.message,"fa-solid fa-triangle-exclamation")}}};window.triggerManageUser=function(t){let e=d.find(n=>n.id===t);e&&(f=t,ge(e),me.classList.add("open"),document.body.style.overflow="hidden")};function ge(t){document.getElementById("user-modal-title").textContent=t.name||"Customer Profile",document.getElementById("user-modal-subtitle").textContent=`Account ID: ${t.id}`;let e=t.status==="blocked",n=!!t.verified;document.getElementById("user-modal-status-badge").innerHTML=`
        <span class="badge ${e?"badge-blocked":"badge-active"}">
            ${e?'<i class="fa-solid fa-ban"></i> Blocked':'<i class="fa-solid fa-circle-check"></i> Active'}
        </span>
    `,document.getElementById("user-modal-verify-badge").innerHTML=`
        <span class="badge ${n?"badge-verified":""}" style="${n?"":"background:#333; color:#aaa;"}">
            ${n?'<i class="fa-solid fa-certificate"></i> Verified Buyer':"Unverified"}
        </span>
    `,document.getElementById("user-modal-orders-count").textContent=t.ordersCount||0,document.getElementById("user-modal-total-spend").textContent=`\u20B9${Number(t.totalSpent||0).toLocaleString("en-IN")}`,document.getElementById("user-modal-name").textContent=t.name||"-",document.getElementById("user-modal-email").textContent=t.email||"-",document.getElementById("user-modal-phone").textContent=t.phone||"Not recorded",document.getElementById("user-modal-address").textContent=t.shippingAddress||"No shipping address recorded yet",document.getElementById("user-modal-created").textContent=$(t.createdAt),rt.value=t.notes||"",z&&(z.innerHTML=e?'<i class="fa-solid fa-lock-open"></i> Unblock Account':'<i class="fa-solid fa-ban"></i> Block Account',z.className=`btn-table-action ${e?"success":"warning"}`),D&&(D.innerHTML=n?'<i class="fa-solid fa-circle-xmark"></i> Remove Verification':'<i class="fa-solid fa-circle-check"></i> Verify Customer',D.className=`btn-table-action ${n?"warning":"success"}`),Fe&&t.email&&(Fe.href=`mailto:${encodeURIComponent(t.email)}?subject=${encodeURIComponent("M\xC8WOS Wear - Regarding Your Account")}`)}async function Nt(){if(!f)return;let t=rt.value.trim();L.disabled=!0,L.textContent="Saving...";try{let n=await(await fetch(`/api/admin/customers/${encodeURIComponent(f)}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:t})})).json();if(n.ok){c("Internal notes saved successfully");let o=d.findIndex(a=>a.id===f);o!==-1&&(d[o].notes=t)}else throw new Error(n.message||"Error saving notes")}catch(e){console.error("Notes save error:",e);try{await k(b(p,"customers",f),{notes:t},{merge:!0});let n=d.findIndex(o=>o.id===f);n!==-1&&(d[n].notes=t),c("Notes saved to Firestore")}catch(n){c("Failed to save notes: "+e.message,"fa-solid fa-triangle-exclamation")}}finally{L.disabled=!1,L.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save Notes'}}function Ze(){me.classList.remove("open"),document.body.style.overflow="",f=null}function Mt(){re.reset(),ue.classList.add("open"),document.body.style.overflow="hidden"}function ie(){ue.classList.remove("open"),document.body.style.overflow=""}async function zt(t){t.preventDefault();let e=document.getElementById("new-user-name").value.trim(),n=document.getElementById("new-user-email").value.trim(),o=document.getElementById("new-user-phone").value.trim(),a=document.getElementById("new-user-status").value,s=document.getElementById("new-user-address").value.trim(),r=document.getElementById("new-user-verified").checked,l=document.getElementById("new-user-notes").value.trim();if(!e||!n){c("Please provide both name and email","fa-solid fa-triangle-exclamation");return}G.disabled=!0,G.textContent="CREATING...";try{let u=await(await fetch("/api/admin/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:e,email:n,phone:o,status:a,shippingAddress:s,verified:r,notes:l})})).json();if(u.ok)c("Customer account created successfully"),ie(),ne();else throw new Error(u.message||"Failed to create customer")}catch(m){console.error("Customer create error:",m),c("Error creating customer: "+m.message,"fa-solid fa-triangle-exclamation")}finally{G.disabled=!1,G.textContent="CREATE CUSTOMER"}}async function V(){try{E&&(E.innerHTML=`
                <tr>
                    <td colspan="7" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Updating transaction & fulfillment records...
                    </td>
                </tr>
            `);let t=!1;try{let e=await fetch("/api/admin/transactions");if(e.ok){let n=await e.json();n.ok&&Array.isArray(n.orders)&&(v=n.orders,t=!0)}}catch(e){console.warn("API transactions fetch notice, trying Firestore:",e.message)}if(!t){let e=await j(A(p,"orders")),n=[];e.forEach(o=>n.push({id:o.id,...o.data()})),v=n}v.sort((e,n)=>new Date(n.createdAt||0)-new Date(e.createdAt||0)),Dt(),X()}catch(t){console.error("Failed to load transactions:",t),E&&(E.innerHTML=`
                <tr>
                    <td colspan="7" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i>
                        Error loading transactions. Please check database permissions.
                    </td>
                </tr>
            `)}}function Dt(){let t=0,e=0,n=0,o=0;v.forEach(a=>{(a.status==="paid"||a.paymentMethod==="razorpay"||a.status==="delivered")&&a.status!=="cancelled"&&(t+=Number(a.subtotal||a.amount||0)),(a.status==="paid"||a.paymentMethod==="razorpay")&&(e+=1),a.paymentMethod==="cod"&&(n+=1),(a.status==="shipped"||a.status==="delivered")&&(o+=1)}),Pe&&(Pe.textContent=`\u20B9${t.toLocaleString("en-IN")}`),Re&&(Re.textContent=`${v.length} orders total`),Ve&&(Ve.textContent=e),He&&(He.textContent=n),je&&(je.textContent=o),$e&&($e.textContent=v.length)}function X(){if(!E)return;let t=((F==null?void 0:F.value)||"").toLowerCase().trim(),e=(U==null?void 0:U.value)||"all",n=(O==null?void 0:O.value)||"all",o=v.filter(a=>{if(e!=="all"&&(a.status||"").toLowerCase()!==e.toLowerCase()||n!=="all"&&(a.paymentMethod||"").toLowerCase()!==n.toLowerCase())return!1;if(!t)return!0;let s=(a.id||"").toLowerCase(),r=(a.customerEmail||"").toLowerCase(),l=(a.customerName||"").toLowerCase(),m=(a.razorpayPaymentId||"").toLowerCase(),u=(a.trackingNumber||"").toLowerCase();return s.includes(t)||r.includes(t)||l.includes(t)||m.includes(t)||u.includes(t)});if(o.length===0){E.innerHTML=`
            <tr>
                <td colspan="7" class="table-empty-cell">
                    <i class="fa-solid fa-receipt"></i>
                    No orders or transactions matching criteria.
                </td>
            </tr>
        `;return}E.innerHTML=o.map(a=>{let s=a.id||"N/A",r=$(a.createdAt),l=Number(a.subtotal||a.amount||0).toLocaleString("en-IN"),m=Array.isArray(a.items)?a.items.reduce((ft,gt)=>ft+(gt.quantity||1),0):1,u=a.paymentMethod==="razorpay",g=a.status||"pending",B=a.trackingNumber||"Unassigned",H=a.carrier||"Delhivery";return`
            <tr>
                <td>
                    <div style="font-weight:600; color:#fff; font-family:monospace; font-size:0.9rem;">${i(s)}</div>
                    <div style="font-size:0.75rem; color:#888;">${r}</div>
                </td>
                <td>
                    <div style="font-weight:500; color:#fff;">${i(a.customerName||"Anonymous")}</div>
                    <div style="font-size:0.75rem; color:#888;">${i(a.customerEmail||"No email")}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:#d4af37;">\u20B9${l}</div>
                    <div style="font-size:0.75rem; color:#888;">${m} item${m===1?"":"s"}</div>
                </td>
                <td>
                    <span class="badge ${u?"badge-verified":""}" style="${u?"":"background:rgba(251,191,36,0.15); color:#fbbf24; border:1px solid rgba(251,191,36,0.3);"}">
                        ${u?'<i class="fa-solid fa-bolt"></i> Razorpay UPI/Card':'<i class="fa-solid fa-hand-holding-dollar"></i> COD'}
                    </span>
                    ${a.razorpayPaymentId?`<div style="font-size:0.7rem; font-family:monospace; color:#888; margin-top:0.25rem;">ID: ${i(a.razorpayPaymentId)}</div>`:""}
                </td>
                <td>
                    ${lt(g)}
                </td>
                <td>
                    <div style="font-size:0.85rem; font-family:monospace; color:#60a5fa;">${i(B)}</div>
                    <div style="font-size:0.75rem; color:#888;">Carrier: ${i(H)}</div>
                </td>
                <td>
                    <button class="btn-table-action" onclick="window.triggerViewOrder('${i(s)}')">
                        <i class="fa-solid fa-eye"></i> View & Track
                    </button>
                </td>
            </tr>
        `}).join("")}function lt(t){switch((t||"").toLowerCase()){case"paid":case"captured":return'<span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Paid</span>';case"shipped":return'<span class="badge" style="background:rgba(96,165,250,0.2); color:#60a5fa; border:1px solid rgba(96,165,250,0.4);"><i class="fa-solid fa-truck"></i> Shipped</span>';case"delivered":return'<span class="badge badge-active"><i class="fa-solid fa-box-check"></i> Delivered</span>';case"processing":return'<span class="badge" style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.4);"><i class="fa-solid fa-gears"></i> Processing</span>';case"cancelled":return'<span class="badge badge-blocked"><i class="fa-solid fa-circle-xmark"></i> Cancelled</span>';case"pending":default:return'<span class="badge" style="background:rgba(251,191,36,0.2); color:#fbbf24; border:1px solid rgba(251,191,36,0.4);"><i class="fa-solid fa-clock"></i> Pending</span>'}}window.triggerViewOrder=function(t){let e=v.find(o=>o.id===t);if(!e)return;S=t,document.getElementById("order-modal-title").textContent=`Order #${e.id}`,document.getElementById("order-modal-date").textContent=`Placed on ${$(e.createdAt)}`,document.getElementById("order-modal-customer").textContent=`${e.customerName||"Client"} (${e.customerEmail||""})`,document.getElementById("order-modal-amount").textContent=`\u20B9${Number(e.subtotal||e.amount||0).toLocaleString("en-IN")}`,document.getElementById("order-modal-payment").textContent=e.paymentMethod==="razorpay"?"Razorpay (Card/UPI)":"Cash on Delivery (COD)",document.getElementById("order-modal-status-badge").innerHTML=lt(e.status),document.getElementById("order-modal-address").textContent=e.shippingAddress||"No shipping address provided.";let n=document.getElementById("order-modal-items-list");Array.isArray(e.items)&&e.items.length>0?n.innerHTML=e.items.map(o=>`
            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid #222;">
                <div>
                    <strong style="color:#fff; font-size:0.9rem;">${i(o.name||"Product")}</strong>
                    <div style="font-size:0.78rem; color:#888;">Size: ${i(o.size||"M")} | Qty: ${o.quantity||1}</div>
                </div>
                <div style="color:#d4af37; font-weight:600; font-size:0.9rem;">
                    \u20B9${Number((o.price||0)*(o.quantity||1)).toLocaleString("en-IN")}
                </div>
            </div>
        `).join(""):n.innerHTML='<div style="padding:1rem; color:#888; font-size:0.85rem; text-align:center;">No line items detailed</div>',Ct.value=e.id,it.value=(e.status||"pending").toLowerCase(),dt.value=e.trackingNumber||"",ct.value=e.carrier||"Delhivery",fe.classList.add("open"),document.body.style.overflow="hidden"};async function Ft(t){if(t.preventDefault(),!S)return;let e=it.value,n=dt.value.trim(),o=ct.value.trim()||"Delhivery";J.disabled=!0,J.textContent="SAVING...";try{let s=await(await fetch(`/api/admin/orders/${encodeURIComponent(S)}/status`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:e,trackingNumber:n,carrier:o})})).json();if(s.ok)c("Order status and tracking updated successfully"),te(),V();else throw new Error(s.message||"Server error")}catch(a){console.error("Order status update error:",a);try{await k(b(p,"orders",S),{status:e,trackingNumber:n,carrier:o,updatedAt:new Date().toISOString()},{merge:!0}),c("Order updated in Firestore"),te(),V()}catch(s){c("Failed to update order: "+a.message,"fa-solid fa-triangle-exclamation")}}finally{J.disabled=!1,J.textContent="SAVE STATUS & TRACKING"}}function te(){fe.classList.remove("open"),document.body.style.overflow="",S=null}async function pe(){try{I&&(I.innerHTML=`
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Fetching payment decline and failure logs...
                    </td>
                </tr>
            `);let t=!1;try{let e=await fetch("/api/admin/failed-transactions");if(e.ok){let n=await e.json();n.ok&&Array.isArray(n.failedTransactions)&&(w=n.failedTransactions,t=!0)}}catch(e){console.warn("API failed transactions fetch notice:",e.message)}if(!t){let e=await j(A(p,"failedTransactions")),n=[];e.forEach(o=>n.push({id:o.id,...o.data()})),w=n}w.sort((e,n)=>new Date(n.createdAt||0)-new Date(e.createdAt||0)),Ut(),mt()}catch(t){console.error("Failed to load failed transactions:",t),I&&(I.innerHTML=`
                <tr>
                    <td colspan="6" class="table-empty-cell">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i>
                        Error loading failed transaction logs.
                    </td>
                </tr>
            `)}}function Ut(){let t=w.length,e=0,n={};w.forEach(s=>{e+=Number(s.amount||s.subtotal||0);let r=s.reason||s.error_description||s.step||"Card / UPI Authentication Failure";n[r]=(n[r]||0)+1});let o="None logged yet",a=0;for(let[s,r]of Object.entries(n))r>a&&(a=r,o=s);Ge&&(Ge.textContent=t),Je&&(Je.textContent=`\u20B9${e.toLocaleString("en-IN")}`),Qe&&(Qe.textContent=t>0?`${o} (${a}x)`:"No failed transactions"),Ae&&(Ae.textContent=t)}function mt(){if(!I)return;let t=((P==null?void 0:P.value)||"").toLowerCase().trim(),e=w.filter(n=>{if(!t)return!0;let o=(n.id||"").toLowerCase(),a=(n.customerEmail||"").toLowerCase(),s=(n.reason||n.error_description||"").toLowerCase(),r=(n.customerName||"").toLowerCase();return o.includes(t)||a.includes(t)||s.includes(t)||r.includes(t)});if(e.length===0){I.innerHTML=`
            <tr>
                <td colspan="6" class="table-empty-cell">
                    <i class="fa-solid fa-shield-check" style="color: #4ade80;"></i>
                    No failed transactions logged.
                </td>
            </tr>
        `;return}I.innerHTML=e.map(n=>{let o=n.id||"tx_unknown",a=$(n.createdAt),s=Number(n.amount||n.subtotal||0).toLocaleString("en-IN"),r=n.reason||n.error_description||n.step||"Payment authorization declined",l=n.customerEmail||"No email",m=n.customerName||"Anonymous Customer",u=encodeURIComponent("M\xC8WOS Wear - Complete Your Luxury Order"),g=encodeURIComponent(`Dear ${m},

We noticed your recent payment of \u20B9${s} on MEWOS Wear was not completed due to: "${r}".

If you experienced any network interruption or bank verification timeout, our client support team is here to help you complete your order smoothly.

Warm regards,
M\xC8WOS Concierge`),B=`mailto:${encodeURIComponent(l)}?subject=${u}&body=${g}`;return`
            <tr>
                <td>
                    <div style="font-weight:600; color:#fff; font-family:monospace; font-size:0.85rem;">${i(o)}</div>
                    <div style="font-size:0.75rem; color:#888;">${a}</div>
                </td>
                <td>
                    <div style="font-weight:500; color:#fff;">${i(m)}</div>
                    <div style="font-size:0.75rem; color:#888;">${i(l)}</div>
                </td>
                <td>
                    <div style="font-weight:600; color:#f87171;">\u20B9${s}</div>
                    <div style="font-size:0.72rem; color:#888;">Attempted</div>
                </td>
                <td>
                    <span class="badge" style="background:rgba(220,53,69,0.15); color:#ff6b6b; border:1px solid rgba(220,53,69,0.3);">
                        <i class="fa-solid fa-credit-card"></i> ${i(n.gateway||"Razorpay")}
                    </span>
                </td>
                <td>
                    <div style="color:#fca5a5; font-size:0.85rem; font-weight:500;">
                        <i class="fa-solid fa-circle-exclamation"></i> ${i(r)}
                    </div>
                    ${n.error_code?`<div style="font-size:0.72rem; font-family:monospace; color:#888;">Code: ${i(n.error_code)}</div>`:""}
                </td>
                <td>
                    <a href="${B}" class="btn-table-action" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; background:#d4af37; color:#111; font-weight:600;">
                        <i class="fa-solid fa-paper-plane"></i> Recover Order
                    </a>
                </td>
            </tr>
        `}).join("")}function ut(){ce.classList.add("open"),document.body.style.overflow="hidden"}function de(){ce.classList.remove("open"),document.body.style.overflow=""}function ye(){document.querySelectorAll(".form-group").forEach(n=>n.classList.remove("invalid"));let e=document.getElementById("prod-sizes-error");e&&(e.style.display="none")}function x(t,e){let n=t.closest(".form-group");if(n){n.classList.add("invalid");let o=n.querySelector(".error-msg");o&&(o.textContent=e)}}function c(t,e="fa-solid fa-circle-check"){!oe||!Ye||!Ke||(Ye.textContent=t,Ke.className=`toast-icon ${e}`,oe.classList.add("show"),setTimeout(()=>{oe.classList.remove("show")},3500))}function i(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Ot(t){if(!t)return"CU";let e=t.trim().split(/\s+/);return e.length===1?e[0].slice(0,2).toUpperCase():(e[0][0]+e[e.length-1][0]).toUpperCase()}function $(t){if(!t)return"N/A";try{let e=new Date(t);return isNaN(e.getTime())?String(t):e.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return String(t)}}function Pt(t){if(!t)return"";let e=t.split(",").map(n=>n.trim());return e.length>=2?e[e.length-2]||e[e.length-1]:e[0]||""}
