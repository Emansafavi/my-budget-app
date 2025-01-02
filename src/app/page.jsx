"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  FileDown,
  CheckCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// CSV Export Helper
function exportToCsv(filename, rows) {
  const csvContent =
    "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function Page() {
  // -----------------------------
  // States
  // -----------------------------
  const [incomes, setIncomes] = useState([{ name: "", amount: 0 }]);
  const [fixedExpenses, setFixedExpenses] = useState([{ name: "", amount: 0 }]);
  const [variableExpenses, setVariableExpenses] = useState([
    { name: "Groceries", predicted: 100, spent: 0 },
  ]);

  // Basic setup
  const [leftoverLastMonth, setLeftoverLastMonth] = useState(0);
  const [threshold, setThreshold] = useState(0);

  // Dates
  const [todayDate, setTodayDate] = useState(new Date());
  const [payDay, setPayDay] = useState(new Date()); // user-chosen pay day

  // -----------------------------
  // Budget Logic
  // -----------------------------
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalFixed = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);

  // Variable
  const totalPredicted = variableExpenses.reduce(
    (sum, v) => sum + v.predicted,
    0
  );
  const totalSpent = variableExpenses.reduce((sum, v) => sum + v.spent, 0);

  // Predicted leftover
  const predictedLeftover =
    leftoverLastMonth + totalIncome - totalFixed - totalPredicted;

  // Actual leftover
  const actualLeftover =
    leftoverLastMonth + totalIncome - totalFixed - totalSpent;

  // Days until pay day (if user sets payDay >= today; else just treat it as 0)
  const msInDay = 1000 * 60 * 60 * 24;
  const daysUntilPayDay = Math.max(
    Math.ceil((payDay.getTime() - todayDate.getTime()) / msInDay),
    0
  );

  // Daily leftover (based on actual leftover)
  const dailyLeftover =
    daysUntilPayDay > 0 ? (actualLeftover / daysUntilPayDay).toFixed(2) : "—";

  // Check threshold
  const isBelowThreshold = actualLeftover < threshold;

  // Distribution (for a progress bar in the Dashboard)
  const fixedPercent = totalIncome ? (totalFixed / totalIncome) * 100 : 0;
  const variablePercent = totalIncome
    ? (totalPredicted / totalIncome) * 100
    : 0;

  // -----------------------------
  // Chart Data
  // -----------------------------
  const barData = variableExpenses.map((item) => ({
    name: item.name,
    predicted: item.predicted,
    spent: item.spent,
  }));

  // -----------------------------
  // CSV Import/Export Handlers
  // -----------------------------
  const handleExportCsv = () => {
    // Example CSV structure
    const rows = [
      ["Section", "Name", "Amount"],
      ...incomes.map((i) => ["Income", i.name, i.amount]),
      ...fixedExpenses.map((f) => ["Fixed", f.name, f.amount]),
      ...variableExpenses.map((v) => [
        "Variable",
        v.name,
        `Predicted: ${v.predicted}, Spent: ${v.spent}`,
      ]),
      ["", "Leftover Last Month", leftoverLastMonth],
      ["", "Total Income", totalIncome],
      ["", "Total Fixed", totalFixed],
      ["", "Total Predicted", totalPredicted],
      ["", "Predicted Leftover", predictedLeftover],
      ["", "Total Spent", totalSpent],
      ["", "Actual Leftover", actualLeftover],
      ["", "Threshold", threshold],
    ];
    exportToCsv("my_budget.csv", rows);
  };

  const handleImportCsv = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");

      let newIncomes = [];
      let newFixed = [];
      // let newVariable = []; // If you want to parse variable lines from CSV

      lines.forEach((line) => {
        const cols = line.split(",");
        const section = cols[0]?.trim();
        const name = cols[1]?.trim();
        const amountStr = cols[2]?.trim();

        if (section === "Income") {
          const amount = parseFloat(amountStr) || 0;
          newIncomes.push({ name, amount });
        } else if (section === "Fixed") {
          const amount = parseFloat(amountStr) || 0;
          newFixed.push({ name, amount });
        }
        // else if (section === "Variable") { parse out predicted/spent if wanted }
      });

      setIncomes(newIncomes);
      setFixedExpenses(newFixed);
    };
    reader.readAsText(file);
  };

  // -----------------------------
  // Income Handlers
  // -----------------------------
  const addIncomeLine = () => {
    setIncomes([...incomes, { name: "", amount: 0 }]);
  };
  const removeIncomeLine = (idx) => {
    const arr = [...incomes];
    arr.splice(idx, 1);
    setIncomes(arr);
  };
  const updateIncomeLine = (idx, field, value) => {
    const arr = [...incomes];
    arr[idx][field] = field === "amount" ? parseFloat(value) || 0 : value;
    setIncomes(arr);
  };

  // -----------------------------
  // Fixed Handlers
  // -----------------------------
  const addFixedLine = () => {
    setFixedExpenses([...fixedExpenses, { name: "", amount: 0 }]);
  };
  const removeFixedLine = (idx) => {
    const arr = [...fixedExpenses];
    arr.splice(idx, 1);
    setFixedExpenses(arr);
  };
  const updateFixedLine = (idx, field, value) => {
    const arr = [...fixedExpenses];
    arr[idx][field] = field === "amount" ? parseFloat(value) || 0 : value;
    setFixedExpenses(arr);
  };

  // -----------------------------
  // Variable Handlers
  // -----------------------------
  const addVariableLine = () => {
    setVariableExpenses([
      ...variableExpenses,
      { name: "", predicted: 0, spent: 0 },
    ]);
  };
  const removeVariableLine = (idx) => {
    const arr = [...variableExpenses];
    arr.splice(idx, 1);
    setVariableExpenses(arr);
  };
  const updateVariableLine = (idx, field, value) => {
    const arr = [...variableExpenses];
    arr[idx][field] = parseFloat(value) || 0;
    setVariableExpenses(arr);
  };
  const updateVariableName = (idx, value) => {
    const arr = [...variableExpenses];
    arr[idx].name = value;
    setVariableExpenses(arr);
  };

  // **New**: Quick “Add Spent” function
  const handleAddSpent = (idx, addValue) => {
    const arr = [...variableExpenses];
    arr[idx].spent += parseFloat(addValue) || 0;
    setVariableExpenses(arr);
  };

  // -----------------------------
  // UI / Layout
  // -----------------------------
  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-white py-6 px-4 space-y-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
        My Budget App
      </h1>

      {/* Budget Setup */}
      <Card className="w-full max-w-3xl shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Budget Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leftover + Threshold */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leftover (Last Month)
              </label>
              <Input
                type="number"
                value={leftoverLastMonth}
                onChange={(e) =>
                  setLeftoverLastMonth(parseFloat(e.target.value) || 0)
                }
                className="shadow-inner"
                placeholder="€0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Threshold
              </label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className="shadow-inner"
                placeholder="€0.00"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Today’s Date
              </label>
              <DatePicker
                selected={todayDate}
                onChange={(date) => setTodayDate(date)}
                className="w-full p-2 shadow-inner rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Day
              </label>
              <DatePicker
                selected={payDay}
                onChange={(date) => setPayDay(date)}
                className="w-full p-2 shadow-inner rounded-md"
              />
            </div>
          </div>

          {/* CSV Import/Export */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Import CSV:</p>
              <Button
                variant="secondary"
                onClick={() => document.getElementById("import-csv").click()}
                className="flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <input
                type="file"
                accept=".csv"
                id="import-csv"
                className="hidden"
                onChange={handleImportCsv}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Export CSV:</p>
              <Button
                onClick={handleExportCsv}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs:
          1) Variable
          2) Fixed
          3) Incomes
          4) Dashboard
       */}
      <Tabs
        defaultValue="variable"
        className="w-full max-w-6xl shadow-md rounded-xl"
      >
        <TabsList className="flex justify-around border-b border-gray-200 bg-white rounded-t-xl">
          <TabsTrigger value="variable" className="text-gray-700">
            Variable
          </TabsTrigger>
          <TabsTrigger value="fixed" className="text-gray-700">
            Fixed
          </TabsTrigger>
          <TabsTrigger value="incomes" className="text-gray-700">
            Incomes
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-gray-700">
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* =================== */}
        {/*  Variable Expenses */}
        {/* =================== */}
        <TabsContent
          value="variable"
          className="p-4 bg-white text-gray-800 rounded-b-xl"
        >
          <Card className="shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Variable Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {variableExpenses.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg shadow-sm border flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="e.g. Groceries"
                      value={item.name}
                      onChange={(e) => updateVariableName(idx, e.target.value)}
                      className="shadow-inner"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Predicted"
                        value={item.predicted}
                        onChange={(e) =>
                          updateVariableLine(idx, "predicted", e.target.value)
                        }
                        className="shadow-inner w-1/2"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Spent"
                        value={item.spent}
                        onChange={(e) =>
                          updateVariableLine(idx, "spent", e.target.value)
                        }
                        className="shadow-inner w-1/2"
                      />
                    </div>
                  </div>

                  {/* Quick "Add Spent" Button + input */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="+€"
                      onKeyDown={(e) => {
                        // Pressing Enter => confirm
                        if (e.key === "Enter") {
                          handleAddSpent(idx, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="shadow-inner w-20"
                    />
                    <Button
                      onClick={() => {
                        const inputElem = document.getElementById(
                          `addSpentInput-${idx}`
                        );
                        // If you store refs or IDs, we could read the value directly
                        // For simplicity, let's do the "onKeyDown" approach above
                      }}
                      className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
                      title="Add spent amount"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Remove line */}
                  {idx > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeVariableLine(idx)}
                      className="mt-2 sm:mt-0 bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button
                onClick={addVariableLine}
                variant="secondary"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                + Add Variable
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== */}
        {/*  Fixed Expenses */}
        {/* =============== */}
        <TabsContent
          value="fixed"
          className="p-4 bg-white text-gray-800 rounded-b-xl"
        >
          <Card className="shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Fixed Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fixedExpenses.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) =>
                      updateFixedLine(idx, "name", e.target.value)
                    }
                    className="shadow-inner"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) =>
                      updateFixedLine(idx, "amount", e.target.value)
                    }
                    className="shadow-inner w-full sm:w-32"
                  />
                  {idx > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeFixedLine(idx)}
                      className="mt-2 sm:mt-0 bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button
                onClick={addFixedLine}
                variant="secondary"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                + Add Fixed
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========== */}
        {/*  Incomes    */}
        {/* =========== */}
        <TabsContent
          value="incomes"
          className="p-4 bg-white text-gray-800 rounded-b-xl"
        >
          <Card className="shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Incomes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomes.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateIncomeLine(idx, "name", e.target.value)}
                    className="shadow-inner"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) =>
                      updateIncomeLine(idx, "amount", e.target.value)
                    }
                    className="shadow-inner w-full sm:w-32"
                  />
                  {idx > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeIncomeLine(idx)}
                      className="mt-2 sm:mt-0 bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={addIncomeLine}
                variant="secondary"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
              >
                + Add Income
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================ */}
        {/*  Dashboard/Chart */}
        {/* ================ */}
        <TabsContent
          value="dashboard"
          className="p-4 bg-white text-gray-800 rounded-b-xl"
        >
          <Card className="shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Leftover Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {/* Predicted Leftover */}
                <div className="p-4 border rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Predicted Leftover</p>
                  <p
                    className={`text-2xl font-semibold ${
                      predictedLeftover >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    €{predictedLeftover.toFixed(2)}
                  </p>
                </div>
                {/* Actual Leftover */}
                <div className="p-4 border rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Actual Leftover</p>
                  <p
                    className={`text-2xl font-semibold ${
                      actualLeftover >= 0 ? "text-green-600" : "text-red-600"
                    } animate-pulse`}
                  >
                    €{actualLeftover.toFixed(2)}
                  </p>
                  {actualLeftover >= 0 ? (
                    <p className="text-xs flex items-center justify-center text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      Positive
                    </p>
                  ) : (
                    <p className="text-xs flex items-center justify-center text-gray-600">
                      <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                      Negative
                    </p>
                  )}
                </div>
                {/* Daily Leftover */}
                <div className="p-4 border rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Daily Leftover</p>
                  <p
                    className={`text-2xl font-semibold ${
                      parseFloat(dailyLeftover) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {dailyLeftover === "—" ? "—" : `€${dailyLeftover}/day`}
                  </p>
                  <p className="text-xs text-gray-400">
                    (Based on days until Pay Day)
                  </p>
                </div>
              </div>

              {/* Threshold Info */}
              <div>
                {isBelowThreshold ? (
                  <p className="text-red-600 flex items-center text-sm">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Warning: Below threshold (€{threshold.toFixed(2)})!
                  </p>
                ) : (
                  <p className="text-green-600 flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Above threshold (€{threshold.toFixed(2)}) — safe.
                  </p>
                )}
              </div>

              {/* Income Distribution Progress Bars */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  Income Distribution
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="whitespace-nowrap">
                    Fixed ({fixedPercent.toFixed(1)}%)
                  </span>
                  <Progress value={fixedPercent} className="flex-1" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="whitespace-nowrap">
                    Variable ({variablePercent.toFixed(1)}%)
                  </span>
                  <Progress value={variablePercent} className="flex-1" />
                </div>
              </div>

              {/* Recharts for Variable Predicted vs. Spent */}
              <div className="p-4 border rounded-md shadow-sm">
                <h3 className="text-sm text-gray-500 mb-3 font-semibold">
                  Variable: Predicted vs. Spent
                </h3>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mb-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#60a5fa" }}
                    />
                    <span className="text-gray-600">Predicted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#f87171" }}
                    />
                    <span className="text-gray-600">Spent</span>
                  </div>
                </div>
                {barData.length > 0 ? (
                  <div className="w-full h-64">
                    <ResponsiveContainer>
                      <BarChart data={barData}>
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          stroke="#4B5563" // gray-700
                        />
                        <YAxis stroke="#4B5563" />
                        <Tooltip
                          formatter={(value) => `€${value}`}
                          labelStyle={{ color: "#374151" }}
                          itemStyle={{ color: "#374151" }}
                          contentStyle={{ backgroundColor: "#fafafa" }}
                        />
                        <Bar dataKey="predicted" fill="#60a5fa" name="Predicted" />
                        <Bar dataKey="spent" fill="#f87171" name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-400">No data to display.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}