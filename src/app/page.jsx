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
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

// Install react-datepicker for a better-looking calendar
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Recharts for charts
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
  const [incomes, setIncomes] = useState([{ name: "", amount: 0 }]);
  const [fixedExpenses, setFixedExpenses] = useState([{ name: "", amount: 0 }]);
  const [variablePredictions, setVariablePredictions] = useState([
    { name: "", amount: 0 },
  ]);

  const [leftoverLastMonth, setLeftoverLastMonth] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [todayDate, setTodayDate] = useState(new Date());
  const [payDay, setPayDay] = useState(new Date());

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalFixed = fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
  const totalVariable = variablePredictions.reduce((sum, v) => sum + v.amount, 0);

  const monthlyVariableBudget = totalIncome - totalFixed - totalVariable;
  const grandTotalLeftover = leftoverLastMonth + monthlyVariableBudget;

  const dayOfMonth = todayDate.getDate();
  const month = todayDate.getMonth();
  const year = todayDate.getFullYear();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = totalDaysInMonth - dayOfMonth;
  const dailyLeftover =
    daysRemaining > 0 ? (monthlyVariableBudget / daysRemaining).toFixed(2) : "—";

  const isBelowThreshold = grandTotalLeftover < threshold;

  const fixedPercent = totalIncome ? (totalFixed / totalIncome) * 100 : 0;
  const variablePercent = totalIncome ? (totalVariable / totalIncome) * 100 : 0;

  const barData = variablePredictions.map((item) => ({
    name: item.name,
    amount: item.amount,
  }));

  const handleExportCsv = () => {
    const rows = [
      ["Section", "Name", "Amount"],
      ...incomes.map((i) => ["Income", i.name, i.amount]),
      ...fixedExpenses.map((f) => ["Fixed", f.name, f.amount]),
      ...variablePredictions.map((v) => ["Variable", v.name, v.amount]),
      ["", "Leftover Last Month", leftoverLastMonth],
      ["", "Total Income", totalIncome],
      ["", "Total Fixed", totalFixed],
      ["", "Total Variable", totalVariable],
      ["", "Monthly Variable Budget", monthlyVariableBudget],
      ["", "Grand Total Leftover", grandTotalLeftover],
      ["", "Threshold", threshold],
    ];
    exportToCsv("my_budget.csv", rows);
  };

  // Handlers for Incomes
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
    arr[idx][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setIncomes(arr);
  };

  // Handlers for Fixed Expenses
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
    arr[idx][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setFixedExpenses(arr);
  };

  // Handlers for Variable Predictions
  const addVariableLine = () => {
    setVariablePredictions([...variablePredictions, { name: "", amount: 0 }]);
  };
  const removeVariableLine = (idx) => {
    const arr = [...variablePredictions];
    arr.splice(idx, 1);
    setVariablePredictions(arr);
  };
  const updateVariableLine = (idx, field, value) => {
    const arr = [...variablePredictions];
    arr[idx][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setVariablePredictions(arr);
  };

  // CSV Import Handler
  const handleImportCsv = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");

      let newIncomes = [];
      let newFixed = [];
      let newVariable = [];

      lines.forEach((line) => {
        const cols = line.split(",");
        const section = cols[0]?.trim();
        const name = cols[1]?.trim();
        const amountStr = cols[2]?.trim();
        const amount = parseFloat(amountStr) || 0;

        if (section === "Income") {
          newIncomes.push({ name, amount });
        } else if (section === "Fixed") {
          newFixed.push({ name, amount });
        } else if (section === "Variable") {
          newVariable.push({ name, amount });
        }
      });

      setIncomes(newIncomes);
      setFixedExpenses(newFixed);
      setVariablePredictions(newVariable);
    };

    reader.readAsText(file);
  };

  return (
    <main className="container mx-auto py-8 px-4 space-y-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-white mb-6">
        Budget Dashboard
      </h1>

      {/* Top Row: Budget Setup & Dashboard */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Setup */}
        <Card className="bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Budget Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Leftover Last Month */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Leftover from Last Month
              </label>
              <Input
                type="number"
                value={leftoverLastMonth}
                onChange={(e) =>
                  setLeftoverLastMonth(parseFloat(e.target.value) || 0)
                }
                className="bg-gray-800 text-white"
                placeholder="€0.00"
              />
            </div>

            {/* Safety Threshold */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Safety Threshold
              </label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(parseFloat(e.target.value) || 0)
                }
                className="bg-gray-800 text-white"
                placeholder="€0.00"
              />
            </div>

            {/* Calendars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-200 mb-2">
                  Today’s Date
                </p>
                <DatePicker
                  selected={todayDate}
                  onChange={(date) => setTodayDate(date)}
                  className="w-full p-2 bg-gray-800 text-white rounded-md"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200 mb-2">
                  Pay Day
                </p>
                <DatePicker
                  selected={payDay}
                  onChange={(date) => setPayDay(date)}
                  className="w-full p-2 bg-gray-800 text-white rounded-md"
                />
              </div>
            </div>

            {/* CSV Import */}
            <div>
              <p className="text-sm text-gray-300 mb-2">
                Import a previously exported CSV:
              </p>
              <Button
                variant="secondary"
                onClick={() => document.getElementById("import-csv").click()}
                className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700"
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
          </CardContent>
        </Card>

        {/* Dashboard */}
        <Card className="bg-gradient-to-r from-green-700 to-green-900 text-white shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grand Total Leftover */}
            <div className="text-center space-y-2">
              <h2 className="text-5xl font-bold animate-pulse">
                €{grandTotalLeftover.toFixed(2)}
              </h2>
              <p className="text-sm flex items-center justify-center">
                {grandTotalLeftover >= 0 ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-1 text-green-400" />
                    Above Threshold
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-1 text-red-400" />
                    Below Threshold
                  </>
                )}
              </p>
            </div>

            {/* Monthly Var Budget & Daily Leftover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Var Budget */}
              <div className="text-center">
                <h3 className="text-xl font-semibold">Monthly Var Budget</h3>
                <p
                  className={`text-3xl font-bold ${
                    monthlyVariableBudget >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  €{monthlyVariableBudget.toFixed(2)}
                </p>
              </div>

              {/* Daily Leftover */}
              <div className="text-center">
                <h3 className="text-xl font-semibold">Daily Leftover</h3>
                <p
                  className={`text-3xl font-bold ${
                    dailyLeftover >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  €{dailyLeftover}/day
                </p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-200 mb-1">
                  Income Distribution
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Fixed ({fixedPercent.toFixed(1)}%)</span>
                  <Progress
                    value={fixedPercent}
                    className="flex-1 bg-gray-700"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">Variable ({variablePercent.toFixed(1)}%)</span>
                  <Progress
                    value={variablePercent}
                    className="flex-1 bg-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
              <p>
                <strong>Last Month Leftover:</strong> €{leftoverLastMonth.toFixed(2)}
              </p>
              <p>
                <strong>Day of Month:</strong> {dayOfMonth} / {totalDaysInMonth}
              </p>
              <p>
                <strong>Days Remaining in Month:</strong> {daysRemaining}
              </p>
            </div>

            {/* Threshold Warning */}
            {isBelowThreshold ? (
              <p className="text-red-500 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-1" />
                Warning: Below your threshold of €{threshold.toFixed(2)}!
              </p>
            ) : (
              <p className="text-green-500 flex items-center">
                <CheckCircle className="w-5 h-5 mr-1" />
                Above threshold (€{threshold.toFixed(2)}) — safe.
              </p>
            )}

            {/* Export CSV Button */}
            <Button
              onClick={handleExportCsv}
              className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Bottom Tabs: Incomes | Fixed | Variable | Charts */}
      <Tabs defaultValue="incomes" className="bg-gray-800 rounded-lg shadow-lg">
        <TabsList className="flex justify-around bg-gray-800 border-b border-gray-700">
          <TabsTrigger value="incomes" className="text-white">
            Incomes
          </TabsTrigger>
          <TabsTrigger value="fixed" className="text-white">
            Fixed
          </TabsTrigger>
          <TabsTrigger value="variable" className="text-white">
            Variable
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-white">
            Charts
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Incomes */}
        <TabsContent
          value="incomes"
          className="p-4 bg-gray-700 text-white rounded-b-lg"
        >
          <Card className="bg-gray-700 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Incomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomes.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateIncomeLine(index, "name", e.target.value)}
                    className="bg-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateIncomeLine(index, "amount", e.target.value)}
                    className="bg-gray-600 text-white w-full sm:w-32"
                  />
                  {index > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeIncomeLine(index)}
                      className="mt-2 sm:mt-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={addIncomeLine}
                variant="secondary"
                className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
              >
                + Add Income
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Fixed */}
        <TabsContent
          value="fixed"
          className="p-4 bg-gray-700 text-white rounded-b-lg"
        >
          <Card className="bg-gray-700 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Fixed Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fixedExpenses.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <Input
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateFixedLine(index, "name", e.target.value)}
                    className="bg-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateFixedLine(index, "amount", e.target.value)}
                    className="bg-gray-600 text-white w-full sm:w-32"
                  />
                  {index > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeFixedLine(index)}
                      className="mt-2 sm:mt-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={addFixedLine}
                variant="secondary"
                className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
              >
                + Add Fixed
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Variable */}
        <TabsContent
          value="variable"
          className="p-4 bg-gray-700 text-white rounded-b-lg"
        >
          <Card className="bg-gray-700 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Variable Predictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variablePredictions.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <Input
                    placeholder="e.g. Groceries"
                    value={item.name}
                    onChange={(e) => updateVariableLine(index, "name", e.target.value)}
                    className="bg-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateVariableLine(index, "amount", e.target.value)}
                    className="bg-gray-600 text-white w-full sm:w-32"
                  />
                  {index > 0 && (
                    <Button
                      variant="destructive"
                      onClick={() => removeVariableLine(index)}
                      className="mt-2 sm:mt-0"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={addVariableLine}
                variant="secondary"
                className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
              >
                + Add Variable
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Charts */}
        <TabsContent
          value="charts"
          className="p-4 bg-gray-700 text-white rounded-b-lg"
        >
          <Card className="bg-gray-700 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Variable Expenses Chart</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <BarChart data={barData}>
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        stroke="#ffffff"
                      />
                      <YAxis stroke="#ffffff" />
                      <Tooltip formatter={(value) => `€${value}`} />
                      <Bar dataKey="amount" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-gray-400">
                  No variable expenses to display.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}