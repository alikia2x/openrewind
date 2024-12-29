import { MouseEventHandler } from "react";
import { Icon } from "@iconify-icon/react";

const MenuItem = ({
	icon,
	text,
	onClick
}: {
	icon: string;
	text: string;
	onClick: MouseEventHandler<HTMLDivElement>;
}) => {
	return (
		<div
			className="flex flex-col hover:bg-gray-200 dark:hover:bg-gray-700
                        rounded-md px-4 py-2 duration-75 gap-0.5 items-center"
			onClick={onClick}
		>
			<div className="text-3xl flex justify-center items-center">
				<Icon icon={icon} width="1em" height="1em" />
			</div>
			<span className="text-xs text-gray-600 dark:text-gray-200">{text}</span>
		</div>
	);
};

export default MenuItem;
