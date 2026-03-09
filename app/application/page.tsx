"use client";

import Link from "next/link";
import { Card } from "../../components/ui/card";
import { CctvIcon, DrillIcon, FactoryIcon, HotelIcon, NutIcon, SaladIcon, TruckIcon } from "lucide-react";


const Dashboard = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-6">Apps</h1>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <Link href="farm/dashboard">
                    <Card className="p-4 shadow-none">
                        <h2 className="text-lg font-semibold">Farm</h2>
                        <p className="text-xl text-primary"><SaladIcon /></p>
                    </Card>
                </Link>
                <Link href="real-estate/dashboard">
                    <Card className="p-4 shadow-none">
                        <h2 className="text-lg font-semibold">Property</h2>
                        <p className="text-xl text-primary"><HotelIcon /></p>
                    </Card>
                </Link>
                <Link href="technical/dashboard">
                    <Card className="p-4 shadow-none">
                        <h2 className="text-lg font-semibold">Technical</h2>
                        <p className="text-xl text-primary"><DrillIcon /></p>
                    </Card>
                </Link>
                <Link href="security/dashboard">
                    <Card className="p-4 shadow-none">
                        <h2 className="text-lg font-semibold">Security</h2>
                        <p className="text-xl text-primary"><CctvIcon /></p>
                    </Card>
                </Link>
                <Link href="transport/dashboard">
                    <Card className="p-4 shadow-none">
                        <h2 className="text-lg font-semibold">Distribution</h2>
                        <p className="text-xl text-primary"><TruckIcon /></p>
                    </Card>
                </Link>
            </div>

        </div>
    );
};

export default Dashboard;
