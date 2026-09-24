"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

// Define the type for the branch data
interface Branch {
	id: number;
	name: string;
	location: string;
	itemCount: number; // Number of inventory items at this branch
}

const Branch = () => {
	const router = useRouter();
	const [branches, setBranches] = useState<Branch[]>([]);

	// Fetch branch data on component mount
	useEffect(() => {
		const fetchBranches = async () => {
			try {
				const response = await fetch("/api/branches");
				const data = await response.json();

				if (response.ok) {
					setBranches(data.branches); // Set branch data with user count
				} else {
					alert(`Error: ${data.message}`);
				}
			} catch (error) {
				console.error("Failed to fetch branches:", error);
				alert("An unexpected error occurred.");
			}
		};

		fetchBranches();
	}, []);

	return (
        <div className="flex flex-col justify-center items-center min-h-[90vh] p-4">

			<Button
				className="mt-4"
				onClick={() => {
					router.push("branch/add"); // Navigate to branch creation page
				}}
			>
				New Branch
			</Button>

			<div className="grid grid-cols-1 gap-4 w-full mt-4">
				{branches.length === 0 ? (
					<Card className="p-4 shadow-none">
						<h2 className="text-lg font-semibold">No branches available</h2>
					</Card>
				) : (
					branches.map((branch) => (
						<Card key={branch.id} className="p-4 shadow-none">
							<h2 className="text-lg font-semibold">{branch.name} </h2>
							<i className="text-lg text-gray-600">{branch.location} -
								{branch.itemCount} items
							</i>
						</Card>
					))
				)}
			</div>
		</div>
	);
};

export default Branch;
