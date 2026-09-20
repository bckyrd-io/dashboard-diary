"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight, HelpCircleIcon, LogInIcon, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function LandingPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [copiedCommand, setCopiedCommand] = useState("");

    const handleLogin = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        router.push("/farm");
    };

    const scrollToFeatures = () => {
        const element = document.getElementById("features");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-white">
            <section className="pt-20 mb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-8">
                                <img src="/logo.png" alt="The Sneaker Lounge Logo" className="h-10" />
                                <span className="text-xl font-bold text-primary">The Sneaker Lounge</span>
                            </div>
                        </div>

                        <p className="text-gray-600 text-lg max-w-2xl">
                            The Sneaker Lounge Management System helps store admins manage users, process sales, track inventory, and analyze performance, while staff can process checkouts, view schedules, and manage stock.
                        </p>

                        <p className="flex space-x-4">
                            <Button onClick={handleLogin} variant={"default"}>
                                Get Started
                                <ShoppingBag size={20} className="ml-2" />
                            </Button>
                            <Button onClick={scrollToFeatures} variant="outline">
                                Help
                                <HelpCircleIcon size={20} className="ml-2" />
                            </Button>
                        </p>
                    </motion.div>
                </div>
            </section>

            <section id="help" className="px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <h2 className="text-3xl font-bold mb-4">User Guide</h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            This guide provides an overview of system functionalities, installation steps, and user roles.
                        </p>
                    </motion.div>

                    <div className="space-y-16">
                        {/* Combined Features Section */}
                        <div className="space-y-8">

                            <div className="space-y-16">
                                {/* Admin Features */}
                                <div>
                                    <h4 className="text-xl font-medium mb-6">Admin Features</h4>
                                    <p className="text-gray-600 mb-8">
                                        Store administrators have full access to manage the entire system, including users, inventory, finances, and reporting.
                                    </p>

                                    <div className="space-y-12">
                                        {/* Admin Feature 1: User Management */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">User Management</h5>
                                            <p className="text-gray-600">
                                                Create, edit, and deactivate user accounts. Assign roles and permissions to staff members.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/user-management.jpg"
                                                    alt="User Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">User management interface with options to edit roles and permissions</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 2: Inventory Management */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Inventory Management</h5>
                                            <p className="text-gray-600">
                                                Manage shoe catalog with categories, pricing, stock levels, and barcode tracking.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="home-analytics.jpg"
                                                    alt="Inventory Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Inventory dashboard showing shoe catalog with categories and stock levels</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 3: Financial Analytics */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Financial Analytics</h5>
                                            <p className="text-gray-600">
                                                Record revenue and expenses. Generate profit reports and financial analyses with visual charts.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/schedule-calendar.jpg"
                                                    alt="Financial Analytics"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Financial dashboard with charts showing sales trends and expense breakdowns</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 4: Schedule Management */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Schedule Management</h5>
                                            <p className="text-gray-600">
                                                Create and assign work schedules to staff members. Set recurring activities and manage calendar events.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/staff-performance.jpg"
                                                    alt="Schedule Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Schedule creation interface with calendar view and assignment options</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Feature 5: Staff Performance */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Staff Performance</h5>
                                            <p className="text-gray-600">
                                                Monitor productivity metrics and generate performance reports for individual staff members.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/generate-report.jpg"
                                                    alt="Performance Dashboard"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Performance analytics showing sales metrics across different staff members</p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Staff Features */}
                                <div>
                                    <h4 className="text-xl font-medium mb-6">Staff Features</h4>
                                    <p className="text-gray-600 mb-8">
                                        Store staff members have focused access to tools for daily operations, processing sales, and managing inventory.
                                    </p>

                                    <div className="space-y-12">
                                        {/* Staff Feature 1: Checkout Processing */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Checkout Processing</h5>
                                            <p className="text-gray-600">
                                                Process customer sales with multiple payment methods including mobile money.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/create-activity.jpg"
                                                    alt="Checkout Processing"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Checkout interface with cart management and payment method selection</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Feature 2: Stock Management */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Stock Management</h5>
                                            <p className="text-gray-600">
                                                View inventory levels, process stock transfers, and receive new shipments.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/request-inventory.jpg"
                                                    alt="Stock Management"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Stock management interface with transfer and receiving options</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff Feature 3: Notifications */}
                                        <div className="space-y-4">
                                            <h5 className="text-lg font-medium text-primary">Notification Center</h5>
                                            <p className="text-gray-600">
                                                Receive updates on low stock alerts, payment confirmations, and schedule changes.
                                            </p>
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src="/notification-schedule.jpg"
                                                    alt="Notification Center"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50">
                                                    <p className="text-sm text-gray-500">Notification panel showing system alerts and messages for staff</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </section>
        </div>
    );
}
