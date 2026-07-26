const SUPABASE_URL = "https://yzbqqduvdvhsownpubyt.supabase.co"
const SUPABASE_ANON_KEY = 'sb_publishable_-JiqDfRgnVn_YgEjUjprqQ_s4XG375D';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let baseCost  = 1500
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const userEmailEl = document.getElementById("user-email");

  if (session && userEmailEl) {
    userEmailEl.innerText = `Logged in as: ${session.user.email}`;
  }
});
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const messageEl = document.getElementById("auth-message");
    const username = document.getElementById("signup-username").value

    const { data, error } = await supabase.auth.signUp({ email, password });


    if (error) {
      messageEl.innerText = error.message;
      console.log(error)
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      messageEl.style.color = "green";
      messageEl.innerText = "Check your inbox for a verification email link!";
      const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      username: username,
      updated_at: new Date()
    });

  if (error) {
    console.error("Error updating profile:", error.message);
  }
    }
  });
}
const signinForm = document.getElementById("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;
    const messageEl = document.getElementById("auth-message");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      messageEl.style.color = "red";
      messageEl.innerText = error.message;
    } else {
      window.location.href = "index.html";
    }
  });
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
}

const loginBtn = document.getElementById("loginButton");
if (loginBtn) {
  loginBtn.addEventListener("click", function(){
    const modal = document.getElementById("loginModal");
    if (modal) modal.style.display = "block";
     document.getElementById("overlay").style.display = "block"
  });
 
}
document.getElementById("overlay").addEventListener("click", function() {
  document.getElementById("overlay").style.display = "none"
  document.getElementById("loginModal").style.display = "none"
})


async function checkUserSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    console.log("Logged in user email:", session.user.email);
    
    const userEmailEl = document.getElementById("user-email");
    if (userEmailEl) {
      userEmailEl.innerText = `Logged in as: ${session.user.email}`;
    }
    getUserProfile()
  } else {
    console.log("No active session found.");
  }
}

checkUserSession();
async function getUserProfile() {
  console.log("get")
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error("Error loading profile:", error.message);
  } else {
    console.log("Username is:", data.username);
    document.getElementById("loginDisplay").innerHTML = data.username
  }
}
const postForm = document.getElementById("create-post-form")
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("You must be logged in to create a post!");
    return;
  }

  const title = document.getElementById("post-title").value;
  const description = document.getElementById("post-desc").value;
  const country = document.getElementById("post-country").value || "Global";
  const post_type = document.getElementById("post-type").value;
  const contact_info = document.getElementById("post-contact").value;
  const { error } = await supabase.from("posts").insert([
    {
      user_id: session.user.id,
      title,
      description,
      country,
      post_type,
      contact_info: contact_info || null
    }
  ]);

  if (error) {
    console.error("Error creating post:", error.message);
  } else {
    postForm.reset();
    fetchPosts();
  }
});
let bulletinPosts = [];
let currentIndex = 0;
async function fetchPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles ( username )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error.message);
    return;
  }

  bulletinPosts = data;
  if (bulletinPosts.length > 0) {
    currentIndex = 0;
    renderCurrentCard();
  } else {
    document.getElementById("carousel-card").innerHTML = "<p>No posts yet!</p>";
  }
}
function renderCurrentCard() {
  const card = document.getElementById("carousel-card");
  const post = bulletinPosts[currentIndex];
  let tagClass = "tag-shared";
  if (post.post_type === "Request") tagClass = "tag-request";
  if (post.post_type === "Offer") tagClass = "tag-offer";
  const authorName = post.profiles?.username || "Anonymous";
  const contactHTML = post.contact_info 
    ? `<div style="margin-top: 10px; font-size: 13px; color: #2c3e50;">
         <strong>💬 Contact:</strong> ${escapeHtml(post.contact_info)}
       </div>`
    : '';

  card.innerHTML = `
    <div>
      <span class="tag ${tagClass}">${post.post_type}</span>
      <span style="font-size: 12px; color: #666;">📍 ${post.country}</span>
    </div>
    <h4 style="margin: 10px 0 2px 0;">${escapeHtml(post.title)}</h4>
    <div style="font-size: 11px; color: #777; margin-bottom: 8px;">Posted by: <strong>@${escapeHtml(authorName)}</strong></div>
    <p style="font-size: 14px; color: #333; margin: 0;">${escapeHtml(post.description)}</p>
    ${contactHTML}
  `;
}
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
fetchPosts()
document.getElementById("nextBtn")?.addEventListener("click", () => {
  if (bulletinPosts.length === 0) return;
  currentIndex = (currentIndex + 1) % bulletinPosts.length;
  renderCurrentCard();
});

document.getElementById("prevBtn")?.addEventListener("click", () => {
  if (bulletinPosts.length === 0) return;
  currentIndex = (currentIndex - 1 + bulletinPosts.length) % bulletinPosts.length;
  renderCurrentCard();
});

setInterval(() => {
  if (bulletinPosts.length > 1) {
    currentIndex = (currentIndex + 1) % bulletinPosts.length;
    renderCurrentCard();
  }
}, 5000);
function calculateRegionAverages(profiles) {
  const regionTotals = {};

  profiles.forEach(profile => {
    const region = profile.geographic_location?.region;
    if (!region) return;

    const totalCost = (profile.costs?.basic_school_supplies || 0) + (profile.costs?.extrapolated_ec_cost || 0);

    if (!regionTotals[region]) {
      regionTotals[region] = { sum: 0, count: 0 };
    }

    regionTotals[region].sum += totalCost;
    regionTotals[region].count += 1;
  });

  const regionAverages = {};
  for (const [region, data] of Object.entries(regionTotals)) {
    regionAverages[region] = Math.round(data.sum / data.count);
  }

  return regionAverages;
}

function renderRatioMap(profilesData) {
  const regionAverages = calculateRegionAverages(profilesData);

  const mapData = [];
  for (const [region, states] of Object.entries(regionStateMap)) {
    const avgCost = regionAverages[region] || 0;
    states.forEach(stateId => {
      mapData.push({
        id: stateId,
        value: avgCost,
        region: region
      });
    });
  }

  anychart.onDocumentReady(function () {
    const map = anychart.map();

    map.geoData("anychart.maps.united_states_of_america");

    map.title("Average Education & Extracurricular Cost by Region ($ USD)");

    const series = map.choropleth(anychart.data.set(mapData));

    series.colorScale(
      anychart.scales.linearColor("#e0f2fe", "#3b82f6", "#1d4ed8", "#1e3a8a")
    );

    series.tooltip().format(function () {
      return `Region: ${this.getData("region")}\nAvg Cost: $${this.value.toLocaleString()}`;
    });

    series.hovered().fill("#f59e0b");
    series.selected().fill("#d97706");

    map.container("ratio-map-container");
    map.draw();
  });
}

fetch("profiles.json")
  .then(response => response.json())
  .then(data => {
    renderCostMap(data.profiles);
    renderRatioMap(data.profiles)
    renderSuppliesMap(data.profiles)
    renderBasicToAdvancedRatioMap(data.profiles)
  })
  .catch(err => console.error("Error loading profiles JSON:", err));
document.getElementById("calculate")?.addEventListener("click", async () => {
  const resultDiv = document.getElementById("calculator-result");
  resultDiv.innerText = "Calculating...";

  const stateSelect = document.getElementById("state");
  const selectedRegion = stateSelect ? stateSelect.value : "";
  const major = document.getElementById("intendedMajor").value;
  const income = document.getElementById("incomeBracket").value;
  
  const ecSelect = document.getElementById("ecSelect");
  const selectedEcIds = Array.from(ecSelect.selectedOptions).map(opt => opt.value);


  if (selectedRegion === "Northeast") baseCost += 500;
  if (selectedRegion === "West") baseCost += 400;
  if (selectedRegion === "Southeast") baseCost += 200;
  if (selectedRegion === "Midwest") baseCost += 150;
  
  if (["Engineering", "Physical Sciences", "Visual Arts", "Performing Arts"].includes(major)) {
    baseCost += 250;
  }

  let totalEcCost = 0;
  
  try {
    const response = await fetch("ecs.json");
    const data = await response.json();
    
    data.extracurriculars.forEach(ec => {
      if (selectedEcIds.includes(ec.id)) {
        totalEcCost += ec.cost_breakdown.average_usd;
      }
    });
  } catch (error) {
    console.error("Error loading ecs.json for calculation:", error);
    resultDiv.innerText = "Error loading extracurricular data.";
    return;
  }

  let finalCost = baseCost + totalEcCost;

  if (income === "Extreme Poverty" || income === "Low Income") {
  }

  resultDiv.innerHTML = `
    Estimated Annual Cost: $${Math.round(finalCost).toLocaleString()} <br>
    <span style="font-size: 0.85rem; color: #64748b; font-weight: normal;">
      (Base + Major/Region: $${Math.round(baseCost)} | Extracurriculars: $${Math.round(totalEcCost)})
    </span>
  `;
});
document.getElementById("searchOppsBtn")?.addEventListener("click", async () => {
  const resultsContainer = document.getElementById("oppResults");
  resultsContainer.innerHTML = "<p>Analyzing database...</p>";

  const country = document.getElementById("country-opt").value;
  const major = document.getElementById("intendedMajor-opt").value;
  const income = document.getElementById("income-opt").value;

  try {
    const response = await fetch("ecs.json");
    const data = await response.json();

    const filteredEcs = data.extracurriculars.filter(ec => {
      const matchesMajor = ec.major_alignment.includes(major);

      let matchesGeo = false;
      if (ec.geographic_dependency.includes("Global") || ec.geographic_dependency.includes("Remote")) {
        matchesGeo = true
      } else if (country === "United States" && ec.geographic_dependency.includes("National (US)")) {
        matchesGeo = true
      }
      let matchesIncome = true;
      if ((income === "Extreme Poverty" || income === "Low Income") && ec.cost_tier === "High") {
        matchesIncome = false; 
      }
      if (income === "Middle Income" && ec.cost_tier === "High") {
        matchesIncome = false; 
      }
      return matchesMajor && matchesGeo && matchesIncome;
    });

    if (filteredEcs.length === 0) {
      resultsContainer.innerHTML = `
        <p style="color: #e74c3c; font-weight: bold;">
          No exact matches found. Try adjusting your parameters!
        </p>`;
      return;
    }

    let html = `<h4 style="color: var(--primary-color);">Found ${filteredEcs.length} matched opportunities:</h4>`;
    html += `<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px; max-height: 400px; overflow-y: auto;">`;
    
    filteredEcs.forEach(ec => {
      html += `
        <div style="border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius); background: #f8fafc;">
          <strong>
            <a href="${ec.url}" target="_blank" style="color: var(--primary-hover); text-decoration: none;">
              ${ec.name}
            </a>
          </strong>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 6px;">
            <strong>Category:</strong> ${ec.category} <br>
            <strong>Cost:</strong> ${ec.cost_tier} (~$${ec.cost_breakdown.average_usd}) <br>
            <strong>Time:</strong> ${ec.time_commitment_hrs_per_week} hrs/week
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    resultsContainer.innerHTML = html;

  } catch (error) {
    console.error("Error fetching ECS database:", error);
    resultsContainer.innerHTML = "<p style='color: red;'>Error loading the opportunity database.</p>";
  }
});
const regionStateMap = {
  "Midwest": ["US.IL", "US.IN", "US.IA", "US.KS", "US.MI", "US.MN", "US.MO", "US.NE", "US.ND", "US.OH", "US.SD", "US.WI"],
  "Northeast": ["US.CT", "US.DE", "US.ME", "US.MD", "US.MA", "US.NH", "US.NJ", "US.NY", "US.PA", "US.RI", "US.VT"],
  "Southwest": ["US.AZ", "US.NM", "US.OK", "US.TX"],
  "Southeast": ["US.AL", "US.AR", "US.FL", "US.GA", "US.KY", "US.LA", "US.MS", "US.NC", "US.SC", "US.TN", "US.VA", "US.WV"],
  "West": ["US.AK", "US.CA", "US.CO", "US.HI", "US.ID", "US.MT", "US.NV", "US.OR", "US.UT", "US.WA", "US.WY"]
};

function calculateRegionCostToIncomeRatios(profiles) {
  const regionData = {};

  profiles.forEach(profile => {
    const region = profile.geographic_location?.region;
    const medianIncome = profile.geographic_location?.region_median_income;
    if (!region || !medianIncome) return;

    const totalCost = (profile.costs?.basic_school_supplies || 0) + (profile.costs?.extrapolated_ec_cost || 0);

    if (!regionData[region]) {
      regionData[region] = { costSum: 0, count: 0, income: medianIncome };
    }

    regionData[region].costSum += totalCost;
    regionData[region].count += 1;
  });

  const ratioResults = {};
  for (const [region, data] of Object.entries(regionData)) {
    const avgCost = data.costSum / data.count;
    const ratio = (avgCost / data.income) * 100;
    
    ratioResults[region] = {
      avgCost: Math.round(avgCost),
      medianIncome: data.income,
      ratio: Number(ratio.toFixed(2))
    };
  }

  return ratioResults;
}

function renderCostMap(profilesData) {
  const regionRatios = calculateRegionCostToIncomeRatios(profilesData);

  const mapData = [];
  for (const [region, info] of Object.entries(regionRatios)) {
    const stateIds = regionStateMap[region] || [];
    
    stateIds.forEach(stateId => {
      mapData.push({
        id: stateId,
        value: info.ratio,
        regionName: region,
        avgCost: info.avgCost,
        medianIncome: info.medianIncome
      });
    });
  }

  anychart.onDocumentReady(function () {
    const map = anychart.map();
    map.geoData("anychart.maps.united_states_of_america");
    map.title("Education & EC Burden: Cost as a % of Regional Median Income");

    const series = map.choropleth(anychart.data.set(mapData));

    series.colorScale(
      anychart.scales.linearColor("#8af6fe", "#16cbf9", "#2693dc", "#1d607f")
    );

    series.tooltip().format(function () {
      return `Region: ${this.getData("regionName")}\n` +
             `Cost / Income Burden: ${this.value}%\n` +
             `Avg Cost: $${this.getData("avgCost").toLocaleString()}\n` +
             `Median Income: $${this.getData("medianIncome").toLocaleString()}`;
    });
    series.tooltip().format(function() {
      return `Region: ${this.getData("regionName")}\nAverage $${this.value.toLocaleString}`
    })
    series.hovered().fill("#38bdf8");
    series.selected().fill("#0284c7");

    map.container("cost-map-container");
    map.draw();
  });
}
function renderSuppliesMap(profilesData) {
  const regionTotals = {};

  profilesData.forEach(profile => {
    const region = profile.geographic_location?.region;
    const supplyCost = profile.costs?.basic_school_supplies || 0;
    if (!region) return;

    if (!regionTotals[region]) {
      regionTotals[region] = { sum: 0, count: 0 };
    }
    regionTotals[region].sum += supplyCost;
    regionTotals[region].count += 1;
  });

  const regionAverages = {};
  for (const [region, data] of Object.entries(regionTotals)) {
    regionAverages[region] = Math.round(data.sum / data.count);
  }

  const mapData = [];
  for (const [region, states] of Object.entries(regionStateMap)) {
    const avgSupplyCost = regionAverages[region] || 0;
    
    states.forEach(stateId => {
      mapData.push({
        id: stateId,
        value: avgSupplyCost,
        regionName: region
      });
    });
  }

  anychart.onDocumentReady(function () {
    const map = anychart.map();
    map.geoData("anychart.maps.united_states_of_america");
    map.title("Average Basic School Supply Costs by Region ($ USD)");

    const series = map.choropleth(anychart.data.set(mapData));

    series.colorScale(
      anychart.scales.linearColor("#ffffff", "#14b8a6", "#91cfca", "#002523")
    );

    series.tooltip().format(function () {
      return `Region: ${this.getData("regionName")}\nAvg Supply Cost: $${this.value.toLocaleString()}`;
    });

    series.hovered().fill("#f59e0b");
    series.selected().fill("#d97706");

    map.container("supplies-map-container");
    map.draw();
  });
}
function renderBasicToAdvancedRatioMap(profilesData) {
  const regionData = {};

  profilesData.forEach(profile => {
    const region = profile.geographic_location?.region;
    const supplies = profile.costs?.basic_school_supplies || 0;
    const ecCost = profile.costs?.extrapolated_ec_cost || 0;
    
    if (!region) return;

    if (!regionData[region]) {
      regionData[region] = { supplySum: 0, ecSum: 0, count: 0 };
    }

    regionData[region].supplySum += supplies;
    regionData[region].ecSum += ecCost;
    regionData[region].count += 1;
  });

  const regionRatios = {};
  for (const [region, data] of Object.entries(regionData)) {
    const avgSupplies = data.supplySum / data.count;
    const avgEcCost = data.ecSum / data.count;
    
    const ratio = avgEcCost > 0 ? (avgSupplies / avgEcCost) * 100 : 0;

    regionRatios[region] = {
      avgSupplies: Math.round(avgSupplies),
      avgEcCost: Math.round(avgEcCost),
    };
  }

  const mapData = [];
  for (const [region, states] of Object.entries(regionStateMap)) {
    const info = regionRatios[region] || { ratio: 0, avgSupplies: 0, avgEcCost: 0 };
    
    states.forEach(stateId => {
      info.ratio = (info.avgSupplies / info.avgEcCost)
      mapData.push({
        id: stateId,
        value: info.ratio,
        regionName: region,
        avgSupplies: info.avgSupplies,
        avgEcCost: info.avgEcCost
      });
    });
  }

  anychart.onDocumentReady(function () {
    const map = anychart.map();
    map.geoData("anychart.maps.united_states_of_america");
    map.title("Basic School Costs as a % of Extracurricular/Advanced Costs");

    const series = map.choropleth(anychart.data.set(mapData));

    series.colorScale(
      anychart.scales.linearColor("#ede9fe", "#8b5cf6", "#6d28d9", "#4c1d95")
    );

    series.tooltip().format(function () {
      return `Region: ${this.getData("regionName")}\n` +
             `Basic vs Advanced: ${this.value}%\n` +
             `Avg Basic Supplies: $${this.getData("avgSupplies").toLocaleString()}\n` +
             `Avg Advanced/EC Cost: $${this.getData("avgEcCost").toLocaleString()}`;
    });

    series.hovered().fill("#f59e0b");
    series.selected().fill("#d97706");

    map.container("supplies-ratio-map-container");
    map.draw();
  });
}
async function renderAidSchools(targetState = "") {
  const resultsContainer = document.getElementById("aidSchoolResults");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "<p style='font-size: 14px;'>Loading financial aid database...</p>";

  try {
    const response = await fetch("finnancialaid.json");
    const data = await response.json();
    let schools = data.need_blind_schools;
    const stateNeighbors = {
      "Massachusetts": ["Connecticut", "Rhode Island", "New Hampshire", "Maine", "New York", "Vermont", "Pennsylvania"],
      "New York": ["Connecticut", "New Jersey", "Pennsylvania", "Massachusetts", "Vermont", "Rhode Island"],
      "California": [],
      "Pennsylvania": ["New York", "New Jersey", "Delaware", "Maryland", "Ohio", "West Virginia"],
      "New Jersey": ["New York", "Pennsylvania", "Delaware"],
      "Connecticut": ["Massachusetts", "New York", "Rhode Island"],
      "Rhode Island": ["Massachusetts", "Connecticut"],
      "New Hampshire": ["Massachusetts", "Maine", "Vermont"],
      "Maine": ["New Hampshire"],
      "North Carolina": ["Virginia", "Tennessee", "South Carolina", "Georgia"],
      "Tennessee": ["North Carolina", "Virginia", "Kentucky", "Georgia", "Alabama", "Mississippi", "Arkansas", "Missouri"],
      "Indiana": ["Illinois", "Michigan", "Ohio", "Kentucky"]
    };

    const neighbors = targetState ? (stateNeighbors[targetState] || []) : [];
    const scoredSchools = schools.map(school => {
      let relevanceScore = 0;
      let matchType = "All Schools";

      if (!targetState) {
        relevanceScore = 1; 
      } else if (school.state.toLowerCase() === targetState.toLowerCase()) {
        relevanceScore = 3; 
        matchType = "Direct State Match";
      } else if (neighbors.includes(school.state)) {
        relevanceScore = 2;
        matchType = "Neighboring Region Match";
      } else {
        relevanceScore = 1;
        matchType = "Other Region";
      }

      return { ...school, relevanceScore, matchType };
    });
    scoredSchools.sort((a, b) => b.relevanceScore - a.relevanceScore);
    let headingText = targetState 
      ? `Showing All Schools (Ranked by Proximity to ${targetState}):` 
      : `All Need-Blind Financial Aid Schools (${scoredSchools.length} Total):`;

    let html = `<h4 style="color: var(--primary-color, #2563eb); margin-bottom: 10px; font-size: 15px;">${headingText}</h4>`;
    html += `<div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">`;

    scoredSchools.forEach(school => {
      let badgeColor = "#64748b"
      if (school.matchType === "Direct State Match") badgeColor = "#10b981";
      else if (school.matchType === "Neighboring Region Match") badgeColor = "#6366f1";

      html += `
        <div style="border: 1px solid var(--border-color, #e2e8f0); padding: 12px; border-radius: 6px; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; font-size: 15px; color: var(--text-main, #1e293b);">${school.institution}</span>
            <span style="font-size: 11px; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px;">${school.matchType} (${school.state})</span>
          </div>
          <div style="font-size: 13px; color: var(--text-muted, #64748b); margin-top: 6px;">
            <strong>Acceptance Rate:</strong> ${school.acceptance_rate} <br>
            <strong>Financial Aid Portal:</strong> 
            <a href="${school.financial_aid_website}" target="_blank" style="color: #2563eb; text-decoration: underline;">
              Visit Website
            </a>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    resultsContainer.innerHTML = html;

  } catch (error) {
    console.error("Error loading finnancialaid.json:", error);
    resultsContainer.innerHTML = `<p style='color: red; font-size: 14px;'>Error loading financial aid database.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAidSchools(""); 
});

document.getElementById("searchAidSchoolsBtn")?.addEventListener("click", () => {
  const selectedState = document.getElementById("search-state-input").value;
  renderAidSchools(selectedState);
});