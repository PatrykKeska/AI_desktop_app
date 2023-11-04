import { useEffect, useState } from "react";

type LoaderProps = {
	loading: boolean;
};

export const Loader = ({ loading }: LoaderProps) => {
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setIsLoading(loading);
	}, [loading]);

	return (
		isLoading && (
			<div className="mx-auto flex h-20 items-center justify-center">
				<div className="relative h-20 w-20 animate-spin rounded-full border-b-2 border-t-2 border-gray-100"></div>
				<span className="absolute animate-bounce text-sm text-green-500">Loading</span>
			</div>
		)
	);
};
