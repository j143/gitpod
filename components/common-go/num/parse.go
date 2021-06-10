// Copyright (c) 2021 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License-AGPL.txt in the project root for license information.

package num

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
)

func ParseInt32(input string) (int32, error) {
	parsed, err := parseInt(input)
	if err != nil {
		return 0, err
	}

	if parsed < 0 || parsed > math.MaxInt32 {
		return 0, fmt.Errorf("input value out of range (int32)")
	}

	return int32(parsed), nil
}

func ParseUint32(input string) (uint32, error) {
	parsed, err := parseInt(input)
	if err != nil {
		return 0, err
	}

	if parsed < 0 || parsed > math.MaxInt32 {
		return 0, fmt.Errorf("input value out of range (uint32)")
	}

	return uint32(parsed), nil
}

func parseInt(input string) (int64, error) {
	s := strings.TrimSpace(input)
	if len(s) == 0 {
		return 0, fmt.Errorf("empty input")
	}

	parsed, err := strconv.ParseInt(input, 10, 64)
	if err != nil {
		numerr := err.(*strconv.NumError)
		if errors.Is(numerr.Err, strconv.ErrSyntax) {
			return 0, fmt.Errorf("invalid input value")
		}

		return 0, err
	}

	return parsed, nil
}
