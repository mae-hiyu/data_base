import React from 'react';
import { Drawer, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useSideMenu } from '../App';

export default function SideMenu() {
	const [selectedItem, setSelectedItem] = useSideMenu();
	const [open, setOpen] = React.useState(false);

	const handleDrawerOpen = () => {
		setOpen(true);
	};
	const handleDrawerClose = () => {
		setOpen(false);
	};

	// 1つだけ選択可能にするための関数
	const handleSelect = (option) => {
		setSelectedItem(selectedItem === option ? null : option); // 選択済みなら解除、未選択なら設定
	};

	return (
		<div>
			<IconButton onClick={handleDrawerOpen}>
				<MenuIcon />
			</IconButton>
			<Drawer
				open={open}
				anchor="right"
				variant="persistent"
			>
				<div>
					<IconButton onClick={handleDrawerClose}>
						<ChevronLeftIcon fontSize="large" />
					</IconButton>
				</div>
				<div style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={selectedItem === 'option1'}
								onChange={() => handleSelect('option1')}
							/>
						}
						label="Optionaaaaaaaaaa 1"
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={selectedItem === 'option2'}
								onChange={() => handleSelect('option2')}
							/>
						}
						label="Option 2"
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={selectedItem === 'option3'}
								onChange={() => handleSelect('option3')}
							/>
						}
						label="Option 3"
					/>
				</div>
			</Drawer>
		</div>
	);
}