// SMART BAG OPTIMIZER
// Four 0/1 Knapsack Algorithms

const $ = (selector) => document.querySelector(selector);

let items = [
  { name: "Laptop", weight: 3, value: 60 },
  { name: "Mobile", weight: 2, value: 40 },
  { name: "Camera", weight: 4, value: 80 },
  { name: "Headphones", weight: 1, value: 20 },
  { name: "Books", weight: 5, value: 50 }
];

const algorithms = {
  brute: {
    title: "Brute Force",
    description: "Checks every possible combination of items and selects the valid combination with the highest total value.",
    time: "O(2ⁿ)",
    space: "O(n)"
  },
  greedy: {
    title: "Greedy",
    description: "Sorts items by value-to-weight ratio and selects the best fitting items. It is fast but does not guarantee the optimal 0/1 Knapsack solution.",
    time: "O(n log n)",
    space: "O(n)"
  },
  dp: {
    title: "Dynamic Programming",
    description: "Uses a table to calculate the maximum value for every item prefix and capacity, then reconstructs the optimal solution.",
    time: "O(n × W)",
    space: "O(n × W)"
  },
  backtracking: {
    title: "Backtracking",
    description: "Explores include/exclude decisions recursively and prunes branches that cannot improve the best known solution.",
    time: "O(2ⁿ) worst case",
    space: "O(n)"
  }
};

let results = {};

// Maximum limits to prevent browser freezing
const MAX_ITEMS = 24;
const MAX_CAPACITY = 20000;

// --------------------------------
// 1. DISPLAY ITEMS
// --------------------------------

function renderItems() {
  const body = $("#items-body");
  body.innerHTML = "";

  $("#empty-state").hidden = items.length > 0;

  items.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${item.weight}</td>
      <td>${item.value}</td>
      <td>
        <button class="remove-button"
          type="button"
          data-remove="${index}">
          Remove
        </button>
      </td>
    `;

    body.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// --------------------------------
// 2. HELPER FUNCTION
// --------------------------------

function createResult(selected, capacity) {
  const weight = selected.reduce(
    (sum, item) => sum + item.weight, 0
  );

  const value = selected.reduce(
    (sum, item) => sum + item.value, 0
  );

  return {
    selected,
    weight,
    value,
    capacity
  };
}

function measureAlgorithm(callback) {
  const start = performance.now();
  const result = callback();
  const end = performance.now();

  result.timeMs = end - start;

  return result;
}

// --------------------------------
// 3. BRUTE FORCE ALGORITHM
// --------------------------------

function bruteForce(capacity) {
  let bestValue = 0;
  let bestItems = [];

  function explore(index, currentWeight, currentValue, selected) {

    // All items have been checked
    if (index === items.length) {

      if (currentValue > bestValue) {
        bestValue = currentValue;
        bestItems = [...selected];
      }

      return;
    }

    // Option 1: Exclude current item
    explore(
      index + 1,
      currentWeight,
      currentValue,
      selected
    );

    // Option 2: Include current item if it fits
    const item = items[index];

    if (currentWeight + item.weight <= capacity) {

      selected.push(item);

      explore(
        index + 1,
        currentWeight + item.weight,
        currentValue + item.value,
        selected
      );

      selected.pop();
    }
  }

  explore(0, 0, 0, []);

  return createResult(bestItems, capacity);
}

// --------------------------------
// 4. GREEDY ALGORITHM
// --------------------------------

function greedyAlgorithm(capacity) {

  // Calculate value / weight ratio
  const sortedItems = items
    .map((item, index) => ({
      ...item,
      originalIndex: index,
      ratio: item.value / item.weight
    }))
    .sort((a, b) =>
      b.ratio - a.ratio || a.originalIndex - b.originalIndex
    );

  let currentWeight = 0;
  let selected = [];

  for (const item of sortedItems) {

    if (currentWeight + item.weight <= capacity) {

      selected.push(items[item.originalIndex]);
      currentWeight += item.weight;
    }
  }

  return createResult(selected, capacity);
}

// --------------------------------
// 5. DYNAMIC PROGRAMMING ALGORITHM
// --------------------------------

function dynamicProgramming(capacity) {

  const n = items.length;

  // Create DP table
  const dp = Array.from(
    { length: n + 1 },
    () => Array(capacity + 1).fill(0)
  );

  // Fill the DP table
  for (let i = 1; i <= n; i++) {

    const item = items[i - 1];

    for (let w = 0; w <= capacity; w++) {

      // Do not select the item
      const exclude = dp[i - 1][w];

      // Select the item if it fits
      let include = 0;

      if (item.weight <= w) {
        include =
          item.value +
          dp[i - 1][w - item.weight];
      }

      dp[i][w] = Math.max(include, exclude);
    }
  }

  // Reconstruct selected items
  let selected = [];
  let remainingCapacity = capacity;

  for (let i = n; i > 0; i--) {

    if (dp[i][remainingCapacity] !==
        dp[i - 1][remainingCapacity]) {

      const item = items[i - 1];

      selected.push(item);
      remainingCapacity -= item.weight;
    }
  }

  selected.reverse();

  return createResult(selected, capacity);
}

// --------------------------------
// 6. BACKTRACKING ALGORITHM
// --------------------------------

function backtracking(capacity) {

  // Sort items by value/weight ratio for better pruning
  const sortedItems = items
    .map((item, index) => ({
      ...item,
      originalIndex: index
    }))
    .sort((a, b) =>
      (b.value / b.weight) - (a.value / a.weight)
    );

  let bestValue = 0;
  let bestSelected = [];

  // Fractional upper bound
  function calculateBound(index, weight, value) {

    if (weight > capacity) return 0;

    let bound = value;
    let remaining = capacity - weight;

    for (let i = index; i < sortedItems.length; i++) {

      const item = sortedItems[i];

      if (item.weight <= remaining) {
        bound += item.value;
        remaining -= item.weight;
      } else {
        bound +=
          (item.value / item.weight) * remaining;
        break;
      }
    }

    return bound;
  }

  function search(index, currentWeight, currentValue, selected) {

    // Update best solution
    if (currentValue > bestValue) {
      bestValue = currentValue;
      bestSelected = [...selected];
    }

    // No more items
    if (index >= sortedItems.length) return;

    // Prune branches that cannot improve best value
    if (
      calculateBound(index, currentWeight, currentValue)
      <= bestValue
    ) {
      return;
    }

    const item = sortedItems[index];

    // Include item
    if (currentWeight + item.weight <= capacity) {

      selected.push(item.originalIndex);

      search(
        index + 1,
        currentWeight + item.weight,
        currentValue + item.value,
        selected
      );

      selected.pop();
    }

    // Exclude item
    search(
      index + 1,
      currentWeight,
      currentValue,
      selected
    );
  }

  search(0, 0, 0, []);

  const selectedItems = bestSelected
    .sort((a, b) => a - b)
    .map(index => items[index]);

  return createResult(selectedItems, capacity);
}

// --------------------------------
// 7. RUN ALL FOUR ALGORITHMS
// --------------------------------

function runAllAlgorithms(capacity) {

  results = {};

  results.brute = measureAlgorithm(
    () => bruteForce(capacity)
  );

  results.greedy = measureAlgorithm(
    () => greedyAlgorithm(capacity)
  );

  results.dp = measureAlgorithm(
    () => dynamicProgramming(capacity)
  );

  results.backtracking = measureAlgorithm(
    () => backtracking(capacity)
  );

  displayComparison();

  showAlgorithm("brute");
}

// --------------------------------
// 8. DISPLAY COMPARISON TABLE
// --------------------------------

function displayComparison() {

  const body = $("#comparison-body");
  body.innerHTML = "";

  Object.keys(algorithms).forEach(key => {

    const result = results[key];
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${algorithms[key].title}</td>
      <td>${result.weight}</td>
      <td>${result.value}</td>
      <td>${result.timeMs.toFixed(4)} ms</td>
    `;

    body.appendChild(row);
  });
}

// --------------------------------
// 9. SHOW INDIVIDUAL ALGORITHM
// --------------------------------

function showAlgorithm(key) {

  const info = algorithms[key];

  if (!info) return;

  $("#algorithm-title").textContent = info.title;
  $("#algorithm-description").textContent = info.description;
  $("#time-complexity").textContent = info.time;
  $("#space-complexity").textContent = info.space;

  document.querySelectorAll(".tab").forEach(tab => {

    const active = tab.dataset.algorithm === key;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  const result = results[key];

  if (result) {

    const selectedNames = result.selected
      .map(item => escapeHtml(item.name))
      .join(", ") || "None";

    $("#algorithm-result").innerHTML = `
      <strong>Selected items:</strong>
      <span class="result-items">${selectedNames}</span>
      <br>
      <strong>Total weight:</strong> ${result.weight}
      <br>
      <strong>Total value:</strong> ${result.value}
      <br>
      <strong>Execution time:</strong> ${result.timeMs.toFixed(4)} ms
    `;

  } else {

    $("#algorithm-result").textContent =
      "Run the algorithms to see the result for your items.";
  }
}

// --------------------------------
// 10. ADD NEW ITEM
// --------------------------------

$("#item-form").addEventListener("submit", event => {

  event.preventDefault();

  const name = $("#item-name").value.trim();
  const weight = Number($("#item-weight").value);
  const value = Number($("#item-value").value);

  const message = $("#form-message");

  if (
    !name ||
    $("#item-weight").value === "" ||
    $("#item-value").value === ""
  ) {
    message.textContent =
      "Please enter an item name, weight and value.";
    return;
  }

  if (
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isInteger(weight) ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    message.textContent =
      "Enter a positive whole-number weight and a valid non-negative value.";
    return;
  }

  if (items.length >= MAX_ITEMS) {
    message.textContent =
      `Maximum ${MAX_ITEMS} items allowed for algorithm testing.`;
    return;
  }

  items.push({ name, weight, value });

  $("#item-name").value = "";
  $("#item-weight").value = "";
  $("#item-value").value = "";

  message.textContent = "Item added successfully.";

  results = {};
  renderItems();

  $("#solve-message").textContent =
    "Item list updated. Run the algorithms again.";
});

// --------------------------------
// 11. REMOVE ITEM
// --------------------------------

$("#items-body").addEventListener("click", event => {

  const button = event.target.closest("[data-remove]");

  if (!button) return;

  items.splice(Number(button.dataset.remove), 1);

  results = {};

  renderItems();

  $("#solve-message").textContent =
    "Item removed. Run the algorithms again.";
});

// --------------------------------
// 12. RESET EXAMPLE
// --------------------------------

$("#reset-button").addEventListener("click", () => {

  items = [
    { name: "Laptop", weight: 3, value: 60 },
    { name: "Mobile", weight: 2, value: 40 },
    { name: "Camera", weight: 4, value: 80 },
    { name: "Headphones", weight: 1, value: 20 },
    { name: "Books", weight: 5, value: 50 }
  ];

  $("#capacity").value = 10;

  $("#form-message").textContent = "";
  $("#solve-message").textContent = "";

  results = {};

  renderItems();

  $("#comparison-body").innerHTML = `
    <tr>
      <td colspan="4" class="muted">
        Run the algorithms to populate this comparison.
      </td>
    </tr>
  `;

  $("#algorithm-result").textContent =
    "Run the algorithms to see the result for your items.";

  showAlgorithm("brute");
});

// --------------------------------
// 13. ALGORITHM TABS
// --------------------------------

document.querySelectorAll(".tab").forEach(tab => {

  tab.addEventListener("click", () => {
    showAlgorithm(tab.dataset.algorithm);
  });
});

// --------------------------------
// 14. RUN BUTTON
// --------------------------------

$("#solve-button").addEventListener("click", () => {

  const capacity = Number($("#capacity").value);

  if (
    $("#capacity").value === "" ||
    !Number.isFinite(capacity) ||
    capacity <= 0 ||
    !Number.isInteger(capacity)
  ) {
    $("#solve-message").textContent =
      "Enter a positive whole-number bag capacity.";
    return;
  }

  if (items.length === 0) {

    $("#solve-message").textContent =
      "Add at least one item before running the algorithms.";

    return;
  }

  if (items.length > MAX_ITEMS) {

    $("#solve-message").textContent =
      `Maximum ${MAX_ITEMS} items allowed for this comparison.`;

    return;
  }

  if (capacity > MAX_CAPACITY) {

    $("#solve-message").textContent =
      `Maximum supported capacity is ${MAX_CAPACITY}.`;

    return;
  }

  $("#solve-message").textContent =
    "Running all four algorithms...";

  try {

    runAllAlgorithms(capacity);

    $("#solve-message").textContent =
      "Success! All four algorithms executed successfully.";

  } catch (error) {

    console.error("Algorithm error:", error);

    $("#solve-message").textContent =
      "Something went wrong. Check the browser console.";
  }
});

// --------------------------------
// 15. INITIALIZE WEBSITE
// --------------------------------

renderItems();
showAlgorithm("brute");