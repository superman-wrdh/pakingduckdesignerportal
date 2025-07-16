-- Remove user assignment from the Plush toys project to move it back to marketplace
UPDATE projects 
SET user_id = NULL 
WHERE id = 'a936907f-1990-4c4e-b6d0-5b147d4c1be7' AND name = 'Plush toys';