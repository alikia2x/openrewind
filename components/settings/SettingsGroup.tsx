import * as React from "react";
import { useRef } from "react";

const SettingsGroup = (
	{ children, groupName, addGroupRef }:
		{ children: React.ReactNode, groupName: string, addGroupRef: Function }) => {
	const groupRef = useRef(null);

	React.useEffect(() => {
		addGroupRef(groupName, groupRef.current);
	}, [groupName, addGroupRef]);

	return (
		<div ref={groupRef} className="my-4">
			{children}
		</div>
	);
};

export default SettingsGroup;